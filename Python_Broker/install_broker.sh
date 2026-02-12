#!/bin/bash

# Farben für schönere Ausgabe
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==============================================${NC}"
echo -e "${GREEN}   MQTT Broker Installer (Mosquitto)          ${NC}"
echo -e "${GREEN}   For Raspberry Pi / Ubuntu / Debian         ${NC}"
echo -e "${GREEN}==============================================${NC}"

# 1. Prüfen auf Root-Rechte
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Fehler: Bitte als Root ausführen!${NC}"
  echo "Nutze: sudo ./install_broker.sh"
  exit 1
fi

# 2. Update & Installation
echo -e "${YELLOW}[1/4] Aktualisiere Paketlisten...${NC}"
apt-get update -qq

echo -e "${YELLOW}[2/4] Installiere Mosquitto und Clients...${NC}"
apt-get install -y mosquitto mosquitto-clients

# 3. Konfiguration für externen Zugriff erstellen
echo -e "${YELLOW}[3/4] Konfiguriere externen Zugriff...${NC}"

CONF_FILE="/etc/mosquitto/conf.d/external_access.conf"

# Wir schreiben die Config neu. 
# 'listener 1883': Hört auf Port 1883 auf ALLEN Interfaces.
# 'allow_anonymous true': Erlaubt dem PineCone Zugriff ohne Passwort.
cat > "$CONF_FILE" <<EOF
listener 1883
allow_anonymous true
EOF

echo -e "   Konfiguration geschrieben nach: $CONF_FILE"

# 4. Neustart und Autostart aktivieren
echo -e "${YELLOW}[4/4] Starte Mosquitto neu...${NC}"
systemctl enable mosquitto
systemctl restart mosquitto

# Prüfen ob er läuft
if systemctl is-active --quiet mosquitto; then
    echo -e "${GREEN}✔ Mosquitto läuft erfolgreich!${NC}"
else
    echo -e "${RED}✘ Fehler: Mosquitto konnte nicht gestartet werden.${NC}"
    echo "Prüfe den Status mit: systemctl status mosquitto"
    exit 1
fi

# 5. IP-Adresse ermitteln (für den PineCone Code)
IP_ADDR=$(hostname -I | awk '{print $1}')

echo -e "${GREEN}==============================================${NC}"
echo -e "${GREEN}   INSTALLATION ABGESCHLOSSEN!                ${NC}"
echo -e "${GREEN}==============================================${NC}"
echo ""
echo "Dein MQTT Broker läuft jetzt."
echo ""
echo -e "WICHTIG FÜR DEINEN PINECONE CODE:"
echo -e "Trage diese IP in 'program.cpp' ein:"
echo -e "${YELLOW}mqtt.connectToIP(\"$IP_ADDR\");${NC}"
echo ""
echo "Um den Broker live zu testen (Monitor), nutze:"
echo "mosquitto_sub -h localhost -t \"#\" -v"
echo ""