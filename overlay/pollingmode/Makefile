CC = /usr/bin/gcc
CFLAGS = -Wall -g -pedantic -O3 -o rathalos
LIBS = -pthread

all: nfclib.c rathalos.c
	$(CC) $(CFLAGS) $(LIBS) nfclib.c rathalos.c
clean:
	rm rathalos
