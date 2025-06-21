#!/bin/bash

# cd .
echo "Shift + Right click > Inspect on an empty space."
export PATH=$PATH:/home/xy/.spicetify
spicetify --extension --live-update watch

echo "Script Ended."
read x;