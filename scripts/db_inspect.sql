#!/bin/bash
export PGPASSWORD='postgres'
psql -U postgres -h localhost -d clinic_db -t -A -c "SELECT jsonb_object_keys(payload) FROM clinic_store WHERE store_key='default';"
