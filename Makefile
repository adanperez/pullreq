# Simple make file to package up a docker instance. To use just you can just type:
#   make build
# Or if you want to name your container you can instead type something like
#   make build image="adanperez/pullreq"
#
# That will create a new directory docker-build, copy the working files there, and
# then kick off a docker build.

.PHONY : build all

temp_dir = docker-build
image = pullreq

build: clean
	mkdir $(temp_dir)
	cp -r public src .bowerrc bower.json Gruntfile.js package.json README.md  $(temp_dir)/
	docker build -t $(image) .
	rm -rf $(temp_dir)

clean:
	rm -rf $(temp_dir)
