# Test example for connect Database container with Deno

## what is this ?

Unit test example to connect database.

## local environment

### initial setup for environment

```shell
cp .env.sample .env
```

### launch container for tests

```shell
deno task container:up
```

### run tests

```shell
deno task test
```

### clean up container

```shell
deno task container:down
```

## CI environment

defined for [GitHub Actions](.github/workflows/ci.yml).

## License

MIT
