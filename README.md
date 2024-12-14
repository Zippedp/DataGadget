# Data Gadget

## Intro
This is a CCI course project. This is a portable device for logging data.

This project currently focuses on self tracking behaviors and habits. The device can be used as a timer and counter. The logged data will be stored in the Micro SD card, and can be connected to a Chrome based browser via Bluetooth to visualize the recorded data. In addition, this device has a rich set of interfaces available: I2C, SPI, and hardware RX. This provides the possibility of expanding more functions.

<img src="./Image/V1FrontPhoto.jpg" alt="V1 Front Photon" width="70%">

## Repositorie structure
+ DataGadget_ArduinoIDE/main
  
  The archived version. Using ArduinoIDE as the compile and upload methord. There were an environment configuration problem in PlatformIO for a while that prevented the code from being compiled correctly.
+ DataGadget_PlatformIO
	+ DataGadget_PlatformIO/lib
   
		Custom libraries.
	+ DataGadget_PlatformIO/src
   
		Main code for Arduino.
+ DataWeb
  
	Code and 3D resources for web visualization APP.
+ Image
  
	Images and diagram.

## Circuit Diagram
<img src="./Image/WiringDiagram.png" alt="Wiring Diagram" width="70%">

The device uses Seeed Xiao ESP32-C3. It is connected to 3 switches, a 0.91" OLED display, a micro SD card reader, and a vibration motor. The main inputs are three buttons, and since the connected pins capable of reading analog signals, the inputs can also be replaced with potentiometers to get more diverse input methods. The main feedback of the device are the OLED display and the vibration. The vibration motor is detachable, so it can also be replaced with other component.


## License
<p xmlns:cc="http://creativecommons.org/ns#" xmlns:dct="http://purl.org/dc/terms/"><a property="dct:title" rel="cc:attributionURL" href="https://github.com/Zippedp/DataGadget">DataGadget</a> by <span property="cc:attributionName">Zeyu Jiao</span> is licensed under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer" style="display:inline-block;">CC BY-NC-SA 4.0 <img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1" alt=""><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1" alt=""><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/nc.svg?ref=chooser-v1" alt=""><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/sa.svg?ref=chooser-v1" alt=""></a></p>
