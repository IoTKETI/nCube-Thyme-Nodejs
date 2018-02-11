#include <wiringPi.h>
#include <stdio.h>
#include <string.h>

#define VCC_PIN 0
#define GREEN_PIN 1
#define BLUE_PIN 2

int turn_on_green(){
	printf("%s\n", "Green Light ON!");
	digitalWrite(VCC_PIN, HIGH); 
	digitalWrite(GREEN_PIN, LOW);
	
	return 0;
}

int turn_off_green(){
	printf("%s\n", "Green Light OFF!");
	digitalWrite(VCC_PIN, HIGH); 
	digitalWrite(GREEN_PIN, HIGH);
	
	return 0;
}

int turn_on_blue(){
	printf("%s\n", "Blue Light ON!");
	digitalWrite(VCC_PIN, HIGH); 
	digitalWrite(BLUE_PIN, LOW);
	
	return 0;
}

int turn_off_blue(){
	printf("%s\n", "Blue Light OFF!");
	digitalWrite(VCC_PIN, HIGH); 
	digitalWrite(BLUE_PIN, HIGH);
	
	return 0;
}

int init(){
	printf("%s\n", "Init Light!");
	digitalWrite(VCC_PIN, HIGH); 
	digitalWrite(GREEN_PIN, HIGH);
	digitalWrite(BLUE_PIN, HIGH);
}

int main (int argc,char *argv[])
{
	int i;
    for (i=0; i < argc; i++)
        printf("Argument %d is %s\n", i, argv[i]);
	
	wiringPiSetup() ;
	pinMode(VCC_PIN, OUTPUT) ;
	pinMode(GREEN_PIN, OUTPUT) ;
	pinMode(BLUE_PIN, OUTPUT) ;

	if(argc == 2){
		char* comm = argv[1];
		
		if(strcmp(comm, "1") == 0){
			turn_on_green();
		} else if(strcmp(comm, "2") == 0){
			turn_off_green();
		} else if(strcmp(comm, "3") == 0){
			turn_on_blue();
		} else if(strcmp(comm, "4") == 0){
			turn_off_blue();
		}else if(strcmp(comm, "0") == 0){
			init();
		}
	}

	return 0 ;
}