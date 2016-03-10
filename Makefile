all:
	$(MAKE) -C css
	$(MAKE) -C js

clean:
	$(MAKE) -C css clean
	$(MAKE) -C js clean

watch: all
	while inotifywait -e MODIFY -r css/src js/src ; do make $^ ; done

.PHONY: all watch clean
