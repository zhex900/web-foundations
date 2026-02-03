npx npm-check-updates --dep prod,dev --upgrade --root
cd epicshop && npx npm-check-updates --dep prod,dev --upgrade --root
cd ..
rm -rf node_modules bun.lock ./epicshop/bun.lock ./epicshop/node_modules ./exercises/**/node_modules
bun install
bun run setup
bun run typecheck
bun run lint --fix
