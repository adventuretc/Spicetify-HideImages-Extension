#!/bin/bash

# https://www.datacamp.com/tutorial/git-push-pull
# klasszikusan ez: git push -u origin master, de nálam nem master hanem main a branch neve.

git push origin main
# vagy
# git push -u origin main


retVal=$?

if [[ retVal ]]; then
	# command returned 0 (0 = true, bashism)
	sleep 2s
	exit 0
else
	# command returned some error
	echo "●●● An error occured. ●●●"
	read x;
fi
