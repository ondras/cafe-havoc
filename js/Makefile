BABEL_BIN := ../node_modules/babel-cli/bin/babel.js
BABEL_ARGS := -M --presets es2015 --plugins transform-es2015-modules-systemjs
BABEL := $(BABEL_BIN) $(BABEL_ARGS)

SRC_FILES := $(shell find src -name '*.js' | sed 's/src\///' | sort)
MAIN := app.js

all: polyfills app

polyfills: polyfills.js

polyfills.js: polyfills/*.js
	cat $^ > $@

app: $(MAIN)

$(MAIN): $(addprefix _build/,$(SRC_FILES))
	cat $^ > $@

_build/%: src/%
	mkdir -p $(dir $@)
	$(BABEL) --module-id $* $^ > $@

clean:
	rm -rf polyfills.js $(MAIN) _build

.PHONY: all polyfills app clean
