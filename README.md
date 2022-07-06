# Obligatorio Tecnologias Blockchain y Contratos Inteligentes

## Setup del respotitorio

### Dependencias
Descargarse los siguientes programas
- [Node](https://nodejs.org/en/) Entorno de ejecucion para ecribir y ejecutar test cases, y tambien para ejecutar el script de deploy
- [Ganache](https://trufflesuite.com/ganache/) Blockchain local con persistencia

### Instalacion de dependencias
Luego de instalado node, habremos intalado el manejador de dependencias `npm`. Con ello ejecutaremos el siguiente comando: 
```shell
npm i
```
### Configuración necesaria
Crear un archivo de variables de entorno `.env` con el contenido:

Variables de entorno para desarrollo local:
```
GANACHE_ACCESSPOINT_URL=GANACHE URL
GANACHE_ACCOUNT=GANACHE ACCOUNT
GANACHE_PRIVATE_KEY=GANACHE ACCOUNT'S PRIVATE KEY
```
Variables de entorno para deployar a testnet:
```
RINKEBY_ACCESSPOINT_URL=GANACHE URL
RINKEBY_ACCOUNT=GANACHE ACCOUNT
RINKEBY_PRIVATE_KEY=GANACHE ACCOUNT'S PRIVATE KEY
```

### Como correr los tests
Ejecutar:
```shell
npx hardhat test
```

### Como deployar los contratos
Ejecutar:
```shell
npx hardhat run scripts/deploy.js --network <network-name>
```

Siendo `network-name` la red a la que se desee deployar (ganache, ethereum, rinkeby, etc).
La red debe estar configurada en el archivo `hardhat.config.js`

En caso que querramos deployar directamente a la red efimera de Hardhat, utilizaremos el comando:
```shell
npx hardhat run scripts/deploy.js
```
## Componentes del proyecto
El proyecto esta estructurado de la siguiente forma:

| Folder | Descripcion |
| ------------- | ------------- |
| `contracts/`  | Contiene todo lo referente a smart contracts, los contratos en si mismos`.sol` asi como tambien interfaces utilizadas que se encuentran dentro de un folder `Interfaces/`  |
| `Documents/`  | Contiene los archivos `.md` que definen el diagrama uml representando las relaciones entre los contratos, asi como tambien los diagramas de secuencia de los metodos mas importantes. Para lograrlo se utilizo la libreria `mermaid` |
| `scripts/`    | Aqui se encuentran los scripts de deploy o algun script auxiliar para realizar el deploy de los contratos inteligentes |
| `test/`       | Contiene los tests para los smart contracts, siguiendo el estandar de un archivo de test por contrato creado |
| `.env`        | Archivo de configuraciones del proyecto. Variables de entorno utilizadas por el archivo de configuraciones de hardhat y script de deploy |
| `.hardhat.config` | Archivo de configuraciones de hardhat |
| `.package.json`   | Dependencias de node |

## Integrantes del equipo, email, numero de estudiante y address registrada

| Integrantes | Email | Numero de estudiante | Github user | Address |
| :-------------: | :-------------: | :-------------: | :-------------: | :-------------: |
| Ramiro Gonzalez | ramirogc21@gmail.com | 167011 | ramigonzalez | 0xc5c527a607149aA2A291B38CE3124A306834A834 |
| Mathias Lantean | mathias.lantean@gmail.com | 180094 | mathiaslantean | 0xE6D7187Be6AA45AEC6ED5C90C2CF5424eB4af959 |
| Itay Brenner    | itay@itaysoft.com | 160865 | itaybre | 0xC4F07CFB7ccC68b047A49F93CAcF853d4bfCF59e |
| Matias Franco   | matiasfranco86@hotmail.com | 177031 | m-franco | 0xEdf1B6F81a6298199007294CBB9141083956FFD1 |

## Destaques
- Metodos/Practicas/Tecnicas utilizados en el proyecto

| Integrantes | Descripcion |
| ------------- | ------------- |
| Patron Ownable | Es un patron que indica que el contrato tiene una o varias direcciones que es dueña del contrato. En nuestro caso hicimos una implementacion propia donde existe un listado de direcciones que estan permitidas a realizar ciertas acciones de gran impacto en el protocolo. La implementacion fue realizada con un mapping para evitar iteraciones al validar la pertenencia de las mismas. |
| Github actions | Se definió un workflow de GitHub para ejecutar los tests automáticamente a la hora de crear un pull request (Ver [historial de ejecuciones](https://github.com/Tecnologias-Blockchain-y-Contratos-Inte/obligatorio-brenner-franco-gonzalez-lantean/actions)). El archivo de configuración se encuentra en [.gihub/workflows/run-tests.yml](https://github.com/Tecnologias-Blockchain-y-Contratos-Inte/obligatorio-brenner-franco-gonzalez-lantean/blob/develop/.github/workflows/run-tests.yml).|
| Gitflow | Es un modelo de trabajo colaborativo que organiza el manejo de ramas en Git, clasificando las tareas (features), resolución de bugs (bugfix), correcciones urgentes (hotfix) y liberaciones (release), y ordenando el proceso para incorporarse al código fuente principal. En nuestro caso utilizamos las ramas master, develop y feature/tarea-a-desarrollar. |
| Board | Se definió un board para organizar el trabajo a realizar, el mismo se encuentra disponible en el [proyecto definido dentro del repositorio](https://github.com/orgs/Tecnologias-Blockchain-y-Contratos-Inte/projects/1) en GitHub.| 
| Weekly Meetings| Se organizaron reuniones semanales para coordinar el trabajo realizado y definir los próximos pasos a seguir. También se utilizó este espacio para resolver problemas entre todos los integrantes del equipo. |


## Address de contratos deployados en la testnet

Contratos usados en la demo:
| Contract Name     | Contract Address |
| -------------:   | :-------------: |
| Vault             | 0xcc2f903fdcd8E80fD10A8DC78Ed514D33FCe2890 |
| TokenContract     | 0xfA5961059ee3A1BB97422d13D67477cFe749b40a |
| Farm              | 0x11372880359CA12A126119FC96a6338879bb2a1d |

Contratos finales:
| Contract Name     | Contract Address |
| -------------:   | :-------------: |
| Vault             | 0xE28f717A4651a7b68840aCF4Ca54EabFD836ED10 |
| TokenContract     | 0x24A0C8c3aFc5A9C8c82683f4A31EFDd0Ce029c32 |
| Farm              | 0xfdfB1a80eaC3D99EaB7ecF829F62857257CA1840 |

## Demo
https://youtu.be/HP8xCderfsQ
