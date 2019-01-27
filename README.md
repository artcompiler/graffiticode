## Getting started with Graffiticode

### Steps include (Mac OSX)

* Clone and initialize the GC repo.
  * `$ git clone git@github.com:graffiticode/graffiticode.git`
  * `$ cd graffiticode`
  * `$ npm install`
* Create local Postgres database (Install Postgres if needed).
  * `$ psql -c "create database localgcdb"`
  * `$ psql -d localgcdb -f tools/initgcdb.sql`
  * `$ export DATABASE_URL_LOCAL="postgres://localhost/localgcdb"`.
* Start Graffiticode app.
  * `make`
* Make an artcompiler (see https://github.com/graffiticode/L0)
