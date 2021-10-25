Development
---

### Run `postgres` on docker
```bash
docker run \
  --name gcdb \
  --rm \
  --detach \
  -e POSTGRES_PASSWORD=notsecret \
  -v ${PWD}/util/initgcdb.sql:/docker-entrypoint-initdb.d/initgcdb.sql \
  -v ${PWD}/util/pg-add-column-hash.sql:/docker-entrypoint-initdb.d/pg-add-column-hash.sql \
  -v ${PWD}/util/pg-add-column-label.sql:/docker-entrypoint-initdb.d/pg-add-column-label.sql \
  -p 5432:5432 \
  postgres

export LOCAL_DATABASE=true
export DATABASE_URL="postgres://postgres:notsecret@127.0.0.1:5432/postgres"
npm install
make

# Clean up
docker stop gcdb
```