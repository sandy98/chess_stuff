all: pruebas.c chessrules.h chessrules.c
	gcc -shared -fPIC -o pruebas.so pruebas.c
	gcc -shared -fPIC -o chessrules.so chessrules.c

clean:
	$(RM) *~ *so
