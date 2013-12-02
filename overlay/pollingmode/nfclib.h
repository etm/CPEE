#ifndef NFCLIB_H
#define NFCLIB_H

#include <pthread.h>

struct nfc_struct;

typedef struct nfc_struct{
  char* nfc_port;  /* Port of NFC_Reader, e.g '/dev/ttyUSB0' , gets initialize with nfc_reader_init(); */
  int fh_read;
  int fh_write;
  pthread_t polling;
  unsigned char read_puffer[100];
  unsigned char write_puffer[100];
  unsigned char* reddit;
  int reddit_len;
  char command[100];
} nfc_reader ;


void* nfc_reader_on_tag(nfc_reader* x,void (*y)(nfc_reader*));

nfc_reader nfc_reader_init(char* name);
int nfc_reader_stop_poll(nfc_reader*);
int nfc_reader_poll(nfc_reader*);
int nfc_reader_destroy(nfc_reader* x);
void* nfc_reader_read(void* y);
void byebye(char *str); 
void* nfc_reader_do(void* y);
int ustrlen(unsigned char* str);
/*
unsigned char* getserial(unsigned char* yoshi);
void strtouchar(char* str,unsigned char* uchar);
*/

#endif /* NFCLIB_H */
