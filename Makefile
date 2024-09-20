
all:
	@echo use 'make install'

install:
	bash ./build-pollingsignals.sh install
	(cd ~/crm;php command.php rebuild)
