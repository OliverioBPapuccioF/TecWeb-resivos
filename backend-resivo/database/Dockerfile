# PostgreSQL database of the project, with a fixed version
# (the official image without a version always takes the latest one, and a new
# major version can not read the data files of the previous one)
FROM postgres:18

# User, password and database name are NOT written here: they come from
# database/.env, which docker-compose passes to the container (env_file).
#
# Since version 18 the data lives in /var/lib/postgresql (up to 17 it was
# /var/lib/postgresql/data). docker-compose mounts ./database/data there.
