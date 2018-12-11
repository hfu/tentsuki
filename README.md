# tentsuki

## how to use streamin.js

```console
$ find .. -name "*.ndjson.bz2" | sort --reverse | xargs -n 1 -I "{}" echo bzcat "{}" | sh | node streamin.js
```
