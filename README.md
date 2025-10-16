# Management dashboard


Efficiently managing and monitoring multiple microcontroller-based devices is a major
challenge in modern IoT environments.[1] The "Management Dashboard" project ad-
dresses this issue by using a Raspberry Pi as a dashboard and access point to monitor all
PineCone BL602 devices connected via Wi-Fi.[2] PineCones are lightweight, affordable,
open IoT development boards commonly used for learning, prototyping and experiment-
ing with wireless IoT devices. In order to give users a complete overview of the connected
network, the dashboard displays key information for each PineCone device, including
its IP address, the time of its last communication with the Raspberry Pi and a brief
description.
In order to implement these systems, the PineCone devices and the Raspberry Pi require
specific configuration and programming. To achieve this, each PineCone device must
be programmed in C/C++ to establish a Wi-Fi connection to the Raspberry Pi and
periodically send information about the device. The Raspberry Pi should also receive
these requests, save them and analyse them for the dashboard. We estimate two ideas for
the dashboard. The first is to use the Raylib library[3] to create a lightweight graphical
interface, or to use the Raspberry Pi to host a web-based dashboard implemented with
Flask[4], for example. This would allow any user on the network to view the analysed
data. To ensure this runs smoothly, the Raspberry Pi software must monitor changes to
the PineCone, pin status or network. In addition, sensors can be connected via the I2C
protocol. The status of these sensors can be read out and their data evaluated.
The project involves low-level programming on the PineCones, as well as backend and
interface development on the Raspberry Pi, making it both technically diverse and versa-
tile. With a team of three developers, the tasks can be divided efficiently with minimaloverlap. In conclusion, this project offers an efficient solution for monitoring and manag-
ing multiple IoT devices via a central Raspberry Pi dashboard.




## References
[1] Elisha Elikem Kofi Senoo et al. “Monitoring and Control Framework for IoT, Im-
plemented for Smart Agriculture”. en. In: Sensors 23.5 (Mar. 2023), p. 2714. issn:
1424-8220. doi: 10.3390/s23052714. url: https://www.mdpi.com/1424- 8220/
23/5/2714 (visited on 10/15/2025).

[2] Marek Kraus. PineCone full documentation - PINE64. Oct. 2024. url: https://
pine64.org/documentation/PineCone/_full/ (visited on 10/14/2025).

[3] raysan5 (Ray), Ahmad Fatoum, and Jeffery Myers. GitHub - raysan5/raylib: A sim-
ple and easy-to-use library to enjoy videogames programming. Git. Oct. 2025. url:
https://github.com/raysan5/raylib (visited on 10/15/2025).

[4] Armin Ronacher. Welcome to Flask — Flask Documentation (3.1.x). Aug. 2025. url:
https://flask.palletsprojects.com/en/stable/ (visited on 10/15/2025).
