#!/bin/bash
echo "=== 1. Health Check ==="
curl -s https://mehreganpetclinic.ir/api/health | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('Status:', d.get('status'))
print('Clinic:', d.get('clinicName'))
print('Version:', d.get('version'))
"

echo ""
echo "=== 2. Login ==="
TOKEN=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"username":"doctor.mehregan","password":"Mhrg-Vet-5834!"}' \
  https://mehreganpetclinic.ir/api/auth/login | \
  sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
echo "Token: ${TOKEN:0:8}..."

echo ""
echo "=== 3. Patients Limit Test ==="
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://mehreganpetclinic.ir/api/patients?limit=5" | \
  python3 -c "
import sys, json
d = json.load(sys.stdin)
print('count:', d.get('count'), 'totalCount:', d.get('totalCount'), 'dataLen:', len(d.get('data', [])))
"

echo ""
echo "=== 4. Clinic Profile ==="
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://mehreganpetclinic.ir/api/patients?limit=1" | \
  python3 -c "
import sys, json
d = json.load(sys.stdin)
print('Patients loaded:', d.get('totalCount'))
"

echo ""
echo "=== 5. Disk Space ==="
df -h / | tail -1
