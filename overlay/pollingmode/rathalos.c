#include "nfclib.h"
#include <stdio.h>
#include <string.h>
#include <unistd.h>

void my_nfc_func1(nfc_reader* x) {
  int i;
  fprintf(stdout,"Hex...\n");
  for(i=0;i<x->reddit_len;i++)
    fprintf(stdout,"%x\t",(x->reddit)[i]);
  fprintf(stdout,"\n");

return;
}
void my_nfc_func2(nfc_reader* x) {
  int i;
  fprintf(stdout,"Character...\n");
  for(i=0;i<x->reddit_len;i++)
    fprintf(stdout,"%c\t",(x->reddit)[i]);
  fprintf(stdout,"\n");

return;
}
void my_nfc_func3(nfc_reader* x) {
  int i;
  fprintf(stdout,"Dezimal Zahlen...\n");
  for(i=0;i<x->reddit_len;i++)
    fprintf(stdout,"%d\t",(x->reddit)[i]);
  fprintf(stdout,"\n");

return;
}
void my_nfc_func4(nfc_reader* x) {
  fprintf(stdout,"ALLE_DURCH\n");
return;
}

void* cancel_thread(void* y){
  nfc_reader *x = y;
  int ret;
  sleep(30);
  ret= nfc_reader_stop_poll(x);
  if(!ret)
    fprintf(stdout,"Killed Poll.\n");
  else
    fprintf(stdout,"Couldn't kill Poll\n");
  return NULL;
}

int main(int argc,char *argv[]) {

  pthread_t thread2;
  nfc_reader x;  
  int rc;
  if(argc < 2)
    byebye("Please set a command as first parameter (-n if you dont want to send a command)\nList of useful commands:\nv....gets Version\nvs Data.... Sets Version (255 255 for Firmware Version)\nb.... Gets Serialnumber\nre Adress.... Read EEPROM (Look at manual for specific addresses and values)\nwe Adress.... Write EEPROM\ndp.... Lower Polling Mode\ndd.... Lower Detection Mode\nx.... Reset\n-n...Do nothing\n");
 
  x = nfc_reader_init("/dev/ttyUSB0");
   
  strcpy(&((x.command)[0]),argv[1]);
  if(strcmp(argv[1],"-n"))
    nfc_reader_do(&x);

  nfc_reader_on_tag(&x,&my_nfc_func1);
  nfc_reader_on_tag(&x,&my_nfc_func2);
  nfc_reader_on_tag(&x,&my_nfc_func3);
  nfc_reader_on_tag(&x,&my_nfc_func4);

  
  rc = pthread_create(&thread2,NULL,&cancel_thread,&x);
  if(rc!=0)
    byebye("Couldnot create thread\n");
  nfc_reader_poll(&x);
  nfc_reader_destroy(&x);

  return 0;
}
