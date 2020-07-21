import os
import time
import subprocess

def forkAndWait():
    p1 = subprocess.Popen(['node', './src/scripts/handlequeue.js']) 
    p1.wait()

if __name__ == "__main__":
    try:
        while True:
            print("forking")
            forkAndWait()
            print("waiting for 10 secs")
            time.sleep(10)
        
    except KeyboardInterrupt as ki:
        print("gracefully exiting")
        exit(0)
