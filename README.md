# Oblgiatorio Tecnologias Blockchain y Contratos Inteligentes

## Dependencias
- [Node](https://nodejs.org/en/)
- [Ganache](https://trufflesuite.com/ganache/)

## Configuración necesaria
Crear un archivo de variables de entorno `.env` con el contenido:
```
GANACHE_ACCESSPOINT_URL=GANACHE URL
GANACHE_ACCOUNT=GANACHE ACCOUNT
GANACHE_PRIVATE_KEY=GANACHE ACCOUNT'S PRIVATE KEY
```

## Como correr los tests
Ejecutar:
```shell
npx hardhat test
```

## Como deployar los contratos
Ejecutar:
```shell
npx hardhat run scripts/deploy.js --network <network-name>
```

Siendo `network-name` la red a la que se desee deployar (ganache, ethereum, rinkeby, etc).
La red debe estar configurada en el archivo `hardhat.config.js`