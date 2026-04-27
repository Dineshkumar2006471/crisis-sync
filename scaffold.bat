@echo off
mkdir temp_scaffold
cd temp_scaffold
npx -y create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --skip-install
echo SCAFFOLD_DONE
