LESSC := ../node_modules/less/bin/lessc
MAIN := app.css

$(MAIN): $(shell find src -name '*.css' -or -name '*.less')
	$(LESSC) src/app.less $@

clean:
	rm -rf $(MAIN)

.PHONY: all clean
