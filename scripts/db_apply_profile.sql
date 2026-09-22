#!/bin/bash
export PGPASSWORD='postgres'

echo "=== Before ==="
psql -U postgres -h localhost -d clinic_db -t -A -c "SELECT payload#>>'{clinicProfile,clinicName}' FROM clinic_store WHERE store_key='default';"
psql -U postgres -h localhost -d clinic_db -t -A -c "SELECT payload#>>'{clinicProfile,phone}' FROM clinic_store WHERE store_key='default';"
psql -U postgres -h localhost -d clinic_db -t -A -c "SELECT payload#>>'{clinicProfile,address}' FROM clinic_store WHERE store_key='default';"

echo "=== Updating ==="
psql -U postgres -h localhost -d clinic_db -c "UPDATE clinic_store SET payload = jsonb_set(payload, '{clinicProfile,clinicName}', '\"کلینیک دامپزشکی حیوانات خانگی مهرگان\"') WHERE store_key='default';"
psql -U postgres -h localhost -d clinic_db -c "UPDATE clinic_store SET payload = jsonb_set(payload, '{clinicProfile,address}', '\"اصفهان، خیابان توحید میانی، حدفاصل مهرداد و شریعتی، کوچه مشکلانی ۲۲\"') WHERE store_key='default';"
psql -U postgres -h localhost -d clinic_db -c "UPDATE clinic_store SET payload = jsonb_set(payload, '{clinicProfile,phone}', '\"03136292278\"') WHERE store_key='default';"
psql -U postgres -h localhost -d clinic_db -c "UPDATE clinic_store SET payload = jsonb_set(payload, '{clinicProfile,emergencyPhone}', '\"09133115509\"') WHERE store_key='default';"
psql -U postgres -h localhost -d clinic_db -c "UPDATE clinic_store SET payload = jsonb_set(payload, '{clinicProfile,website}', '\"https://mehreganpetclinic.ir\"') WHERE store_key='default';"
psql -U postgres -h localhost -d clinic_db -c "UPDATE clinic_store SET payload = jsonb_set(payload, '{clinicProfile,email}', '\"info@mehreganpetclinic.ir\"') WHERE store_key='default';"
psql -U postgres -h localhost -d clinic_db -c "UPDATE clinic_store SET payload = jsonb_set(payload, '{clinicProfile,phoneNumbers}', '[\"03136292278\",\"03136263124\",\"03136293353\"]') WHERE store_key='default';"

echo "=== After ==="
psql -U postgres -h localhost -d clinic_db -t -A -c "SELECT payload#>>'{clinicProfile,clinicName}' FROM clinic_store WHERE store_key='default';"
psql -U postgres -h localhost -d clinic_db -t -A -c "SELECT payload#>>'{clinicProfile,phone}' FROM clinic_store WHERE store_key='default';"
psql -U postgres -h localhost -d clinic_db -t -A -c "SELECT payload#>>'{clinicProfile,address}' FROM clinic_store WHERE store_key='default';"
