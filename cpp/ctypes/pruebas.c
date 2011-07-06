#include <stdio.h>
#include <malloc.h>
#include <string.h>

long factorial(int n);

long factorial(int n) {
    if (n < 2)
        return n;
    return (long)n * factorial(n - 1);
    }

long long unsigned my63() {
    long long unsigned x = 1;
    return x << 63;
    }

long long unsigned myX(int shift) {
    long long unsigned x = 1;
    return x << shift;
    }
    
void printmy63() {
    printf("\nNumber is %llu\n\n", my63());
    }
    
typedef struct {
    int uno;
    int dos;
    int tres;
    char* msg;
    }    MyStruct;
    

int initMyStruct(MyStruct *struc, int uno, int dos, int tres, char *msg) {
    int len = strlen(msg);
    struc->uno = uno;
    struc->dos = dos;
    struc->tres = tres;
    struc->msg = (char*)malloc(sizeof(char)*(len + 1));
    strcpy(struc->msg, msg);
    return len;
    }
    
int *myIntArray(int *cuantos) {
    *cuantos = 3;
    int *array = (int *)malloc(3 * sizeof(int));
    array[0] = 55;
    array[1] = 7;
    array[2] = 26;
    return array;
    }

int *bitsSet(int *num, unsigned long long bb) {
    int i[64];
    int loop;
    int counter;
    int *retval;

    counter = 0;    
    for (loop = 0; loop < 64; loop++) {
        if (bb & ((unsigned long long)1 << loop)) {
            i[counter++] = loop;
            }
        }
    retval = (int *)malloc(counter * sizeof(int));
    memcpy(retval, i, counter * sizeof(int));
    *num = counter;
    return retval;
    }
    
    
int main(int argc, char *argv[]) {
    int i;
    int num;
    int *x, *y;
    x = myIntArray(&num);
    printf("Function myIntArray retrieves %i numbers: %i, %i, %i\n", num, x[0], x[1], x[2]);
    free(x);
    y = bitsSet(&num, (unsigned long long)28);
    printf("Function bitsSet called with 28 retrieves %i numbers\n", num);
    for (i = 0; i < num; i++)
        printf("%i\t", y[i]);
    printf("\n");
    free(y);
    return 0;
    }