CXXFLAGS=-I/usr/include/python2.6 -I/usr/include/boost -fPIC
LDFLAGS= -lboost_python -lboost_regex -lpython2.6

MODULE=cppchessrules.so
TEST=cppchessrules.exe

all: $(MODULE) $(TEST)

 
$(MODULE): chessrules.o
	$(CC) -shared $(LDFLAGS) -o $@ $^

$(TEST): chessrules.o
	g++ $(LDFLAGS) -o $@ $^
	$(RM) *.o *~ \#*

clean:
	$(RM) $(MODULE) $(TEST) *.o *~ \#*

