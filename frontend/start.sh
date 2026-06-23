#!/bin/sh
MAX=30
i=0
echo "Waiting for backend DNS..."
while [ "$i" -lt "$MAX" ]; do
    if getent hosts backend >/dev/null 2>&1; then
        echo "Backend resolved in ${i}s"
        break
    fi
    sleep 1
    i=$((i + 1))
done
if [ "$i" -ge "$MAX" ]; then
    echo "ERROR: backend DNS timeout after ${MAX}s" >&2
    exit 1
fi
exec /docker-entrypoint.sh nginx -g 'daemon off;'
