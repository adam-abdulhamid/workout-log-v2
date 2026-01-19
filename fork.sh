#!/bin/bash

# Fork this starter template into a new project
# Usage: ./fork.sh <project-name> [--simple]
# Example: ./fork.sh calorie-tracker
# Example: ./fork.sh landing-page --simple
#
# Options:
#   --simple, -s    Create a simple app without auth, database, or email setup
#
# Prerequisites (for full apps):
#   - GitHub CLI installed and authenticated (gh auth login)
#   - Neon CLI installed and authenticated (brew install neonctl && neonctl auth)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
SIMPLE_MODE=false
PROJECT_NAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --simple|-s)
            SIMPLE_MODE=true
            shift
            ;;
        -*)
            echo -e "${RED}Error: Unknown option $1${NC}"
            echo "Usage: ./fork.sh <project-name> [--simple]"
            exit 1
            ;;
        *)
            if [ -z "$PROJECT_NAME" ]; then
                PROJECT_NAME="$1"
            else
                echo -e "${RED}Error: Unexpected argument $1${NC}"
                exit 1
            fi
            shift
            ;;
    esac
done

# Check if project name provided
if [ -z "$PROJECT_NAME" ]; then
    echo -e "${RED}Error: Please provide a project name${NC}"
    echo "Usage: ./fork.sh <project-name> [--simple]"
    echo "Example: ./fork.sh calorie-tracker"
    echo "Example: ./fork.sh landing-page --simple"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$(dirname "$SCRIPT_DIR")/apps/$PROJECT_NAME"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo "Install it with: brew install gh"
    echo "Then authenticate: gh auth login"
    exit 1
fi

# Check if gh is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI is not authenticated${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Check if target directory already exists
if [ -d "$TARGET_DIR" ]; then
    echo -e "${RED}Error: Directory already exists: $TARGET_DIR${NC}"
    exit 1
fi

# Get GitHub username
GH_USER=$(gh api user --jq '.login')

echo -e "${GREEN}========================================${NC}"
if [ "$SIMPLE_MODE" = true ]; then
echo -e "${GREEN}  Forking app-starter to $PROJECT_NAME (simple mode)${NC}"
else
echo -e "${GREEN}  Forking app-starter to $PROJECT_NAME${NC}"
fi
echo -e "${GREEN}========================================${NC}"
echo ""

# Determine total steps based on mode
if [ "$SIMPLE_MODE" = true ]; then
    TOTAL_STEPS=2
else
    TOTAL_STEPS=5
fi

# --- Step 1: Copy files ---
echo -e "${BLUE}[1/$TOTAL_STEPS] Copying files to $TARGET_DIR...${NC}"
mkdir -p "$TARGET_DIR"
rsync -a --exclude='.git' --exclude='node_modules' --exclude='.next' --exclude='templates' "$SCRIPT_DIR/" "$TARGET_DIR/"
cd "$TARGET_DIR"

# Initialize variables
DATABASE_URL=""
NEON_ORG_ID=""
CLERK_PK=""
CLERK_SK=""
CLERK_WEBHOOK=""
RESEND_KEY=""

if [ "$SIMPLE_MODE" = true ]; then
    # --- Simple mode: Skip auth/db/email setup ---
    echo ""
    echo -e "${YELLOW}Simple mode: Skipping database, auth, and email setup${NC}"

    # Remove auth-related files for simple apps
    echo -e "${BLUE}[2/$TOTAL_STEPS] Cleaning up auth/db files...${NC}"
    rm -rf src/app/\(auth\) 2>/dev/null || true
    rm -rf src/app/\(dashboard\) 2>/dev/null || true
    rm -rf src/app/api/webhooks 2>/dev/null || true
    rm -rf src/db 2>/dev/null || true
    rm -f src/middleware.ts 2>/dev/null || true

    # Copy simple mode templates
    cp "$SCRIPT_DIR/templates/simple/app/layout.tsx" src/app/layout.tsx
    cp "$SCRIPT_DIR/templates/simple/app/page.tsx" src/app/page.tsx
    cp "$SCRIPT_DIR/templates/simple/package.json" package.json
    cp "$SCRIPT_DIR/templates/simple/env.local" .env.local

    # Remove full-mode-only files
    rm -f drizzle.config.ts
    rm -f src/lib/email.ts

    echo -e "  ${GREEN}✓${NC} Applied simple mode templates"

else
    # --- Full mode: Set up database, auth, and email ---
    # (Uses root files as-is, no template copying needed)

    # --- Step 2: Create Neon database ---
    if command -v neonctl &> /dev/null; then
        echo -e "${BLUE}[2/$TOTAL_STEPS] Creating Neon database...${NC}"

        # Check if neonctl is authenticated
        if neonctl me &> /dev/null; then
            # Check for multiple orgs and let user select
            ORGS=$(neonctl orgs list --output json 2>/dev/null || echo "[]")
            ORG_COUNT=$(echo "$ORGS" | jq 'length')

            if [ "$ORG_COUNT" -gt "1" ]; then
                echo -e "  ${YELLOW}Multiple Neon organizations found:${NC}"
                echo "$ORGS" | jq -r 'to_entries[] | "    \(.key + 1). \(.value.name) (\(.value.id))"'
                echo ""
                read -p "  Select organization (1-$ORG_COUNT): " ORG_CHOICE
                NEON_ORG_ID=$(echo "$ORGS" | jq -r ".[$((ORG_CHOICE - 1))].id")
            elif [ "$ORG_COUNT" -eq "1" ]; then
                NEON_ORG_ID=$(echo "$ORGS" | jq -r '.[0].id')
            fi

            # Build the create command with optional org flag
            CREATE_CMD="neonctl projects create --name $PROJECT_NAME --output json"
            if [ -n "$NEON_ORG_ID" ]; then
                CREATE_CMD="$CREATE_CMD --org-id $NEON_ORG_ID"
            fi

            # Create the project and capture output
            NEON_OUTPUT=$(eval "$CREATE_CMD" 2>/dev/null)

            if [ $? -eq 0 ]; then
                # Extract project ID
                PROJECT_ID=$(echo "$NEON_OUTPUT" | jq -r '.project.id // .id // empty')

                if [ -n "$PROJECT_ID" ]; then
                    # Get the connection string
                    CONN_CMD="neonctl connection-string $PROJECT_ID --database-name neondb"
                    if [ -n "$NEON_ORG_ID" ]; then
                        CONN_CMD="$CONN_CMD --org-id $NEON_ORG_ID"
                    fi
                    DATABASE_URL=$(eval "$CONN_CMD" 2>/dev/null || true)

                    if [ -n "$DATABASE_URL" ]; then
                        echo -e "  ${GREEN}✓${NC} Created Neon project: $PROJECT_NAME"
                    else
                        echo -e "  ${YELLOW}⚠${NC} Project created but couldn't get connection string"
                        echo -e "  ${YELLOW}  Get it from: https://console.neon.tech${NC}"
                    fi
                fi
            else
                echo -e "  ${YELLOW}⚠${NC} Failed to create Neon project"
            fi
        else
            echo -e "  ${YELLOW}⚠${NC} Neon CLI not authenticated. Run: neonctl auth"
        fi
    else
        echo -e "${BLUE}[2/$TOTAL_STEPS] Skipping Neon setup (neonctl not installed)${NC}"
        echo -e "  ${YELLOW}Install with: brew install neonctl && neonctl auth${NC}"
    fi

    # --- Step 3: Get Clerk credentials ---
    echo ""
    echo -e "${BLUE}[3/$TOTAL_STEPS] Clerk Setup${NC}"
    echo -e "  ${YELLOW}Create a new Clerk application at: https://dashboard.clerk.com${NC}"
    echo ""

    read -p "  Enter NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (pk_test_...): " CLERK_PK
    read -p "  Enter CLERK_SECRET_KEY (sk_test_...): " CLERK_SK
    echo ""
    echo -e "  ${YELLOW}Note: CLERK_WEBHOOK_SECRET is needed for production (set up webhook later)${NC}"
    read -p "  Enter CLERK_WEBHOOK_SECRET (optional, press Enter to skip): " CLERK_WEBHOOK

    # --- Step 4: Optional Resend setup ---
    echo ""
    echo -e "${BLUE}[4/$TOTAL_STEPS] Resend Email Setup (optional)${NC}"
    echo -e "  ${YELLOW}Get an API key at: https://resend.com${NC}"
    read -p "  Enter RESEND_API_KEY (optional, press Enter to skip): " RESEND_KEY

    # --- Generate .env.local ---
    echo ""
    echo -e "${BLUE}[5/$TOTAL_STEPS] Creating .env.local...${NC}"

    cat > .env.local << EOF
# Database (Neon)
DATABASE_URL=${DATABASE_URL:-postgresql://user:password@host/database?sslmode=require}

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${CLERK_PK}
CLERK_SECRET_KEY=${CLERK_SK}
CLERK_WEBHOOK_SECRET=${CLERK_WEBHOOK}

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Resend Email
RESEND_API_KEY=${RESEND_KEY}
EOF

    echo -e "  ${GREEN}✓${NC} Created .env.local"
fi

# --- Initialize git and push ---
echo ""
FINAL_STEP=$((TOTAL_STEPS + 1))
echo -e "${BLUE}[$FINAL_STEP/$FINAL_STEP] Setting up Git repository...${NC}"
git init -b main
git add .
if [ "$SIMPLE_MODE" = true ]; then
    git commit -m "Initial commit: forked from app-starter (simple mode)"
else
    git commit -m "Initial commit: forked from app-starter"
fi

echo "  Creating GitHub repository: $GH_USER/$PROJECT_NAME..."
gh repo create "$PROJECT_NAME" --private --source=. --remote=origin --push

# --- Done! ---
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  Local:  ${YELLOW}$TARGET_DIR${NC}"
echo -e "  GitHub: ${YELLOW}https://github.com/$GH_USER/$PROJECT_NAME${NC}"
if [ -n "$DATABASE_URL" ]; then
echo -e "  Neon:   ${YELLOW}https://console.neon.tech${NC}"
fi
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  cd ../apps/$PROJECT_NAME"
echo "  pnpm install"
if [ "$SIMPLE_MODE" = true ]; then
echo "  pnpm dev            # Start development server"
else
if [ -z "$DATABASE_URL" ]; then
echo "  # Update DATABASE_URL in .env.local"
fi
echo "  pnpm db:push        # Push schema to database"
echo "  pnpm dev            # Start development server"
fi
