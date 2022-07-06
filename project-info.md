# Instalacion de paquetes necesarios para desarrollar un smart contract

- Para poder compilar el codigo solidity vamos a utilizar el package `solc` 

```shell
npm i solc 
```

- Para poder desarrollar, deployar, y testear un contrato inteligente vamos a utilizar la libreria `hardhat`. Es quien nos facilita las comunicaciones RPC con la blockchain.

Libreria equivalente: `Truffle` 

```shell
npm i hardhat
``` 

Vamos a utilizar libreria `ethers` como una interfaz para poder comunicarnos con un nodo proveedor o un nodo en la blockchain. 

```shell
npm i ethers
```
Libreria equivalente: `web3.js`



# Comandos para ejecutar Hardhat
| Command | Description |
| :---: | :--- |
| `npx hardhat init` | Inicializa la configuracion de hardhat blockchain virtual. **Seleccionar la opcion:** *Create an empty hardhat.config.js*  |
| `npx hardhat compile` | Compila el contrato. Genera una carpeta en el root del proyecto llamada **artifacts**. Aqui se encuentra el ABI y el Bytecode del smart contract compilado. ABI: `artifacts/contracts/<contract-name>.sol/<contract-name>.json`  |
| `npx hardhat run scripts/deploy.js` | Deploy a la network por defecto |
| `npx hardhat run scripts/deploy.js --network ganache`|  Deploy a network especifica, ejemplo deploy a ganache | 


## Configuracion de Hardhat
El archivo `hardhat.config.js` va a permitirnos decirle al compilador de solidity con que version debe compilar asi como tambien a que redes nos podemos conectar.

### Solidity version:  
Utilizamos la version `0.8.9` porque es full compatible con Hardhat.

### Networks
- Hardhat: blockchain virtual no persistente
- Ganache: blockchain local persistente
- Rinkeby: testnet de Ethereum

# Archivo scripts/deploy.js
En el archivo deploy vamos a programar de que forma vamos a deployar nuestro contrato inteligente.

## Provider y Signer
Vamos a necesitar un `provider` (proveedor) y un `signer` (firmante). El proveedor me va a servir para hacer operaciones de lectura, y el firmante para hacer operaciones de lectura y escritura.

* ### Provider
  El `provider` va a conocer es a que `url` nos vamos a conectar a la blockchain.

  Tenemos 2 formas de obtener nuestro provider: 
  
  1. Si utilizamos la red de hardhat, vamos a intanciar nuestro provider por defecto mediante `ethers` llamando a:
   
      ```shell
      const provider = ethers.provider
      ```
  2. Si utilizamos otra network (red), le tenemo s que indicar el `ACCESSPOINT_URL`.
      ```shell
      const provider = new ethers.providers.JsonRpcProvider(ACCESSPOINT_URL);
      ```

* ### Signer 
A diferencia del provider, el `signer` ademas de conocer la `url` de la red a la que se conecta, **sabe firmar transacciones**.


Al obtener los firmantes mediante la libreria ethers, nos va a evantar las claves privadas que se encuentren en `accounts` en el archivo `hardhat.config.js`.

Esto lo hacemos mediante el siguiente codigo:
```shell
const [signer] = await ethers.getSigners()
```

## Deployar un contrato a la blockchain
Para poder deployar un contrato, primero que nada debemos instanciar un `contractFactory`. Para ello necesitamos el `path` del contrato y una comunicacion a la blockchain por medio de un `provider` o de un `signer`. 

__*Nota:*__ si instanciamos un contrato con un `provider`, tendremos acceso de lectura a la blockchain unicamente dado que no tendremos la capacidad de enviar TX firmadas, para ello utilizamos el `signer`.

Por lo tanto instanciamos nuestro `contractFactory` usando el `signer`.

```shell
    const contractFactory   = await ethers.getContractFactory(contractPath, signer);
```

Una vex que tenemos nuestro `contractFactory` instanciado podemos deployarlo a la blockchain. Para ello llamamos al metodo `deploy()`.

```shell
const deployedContract  = await contractFactory.deploy();
```

El metodo `.deploy()` acepta como parametros aquellos parametros que esten definidos en el constructor del contrato, y por ultimo puede recibir datos referentes a la transaccion donde se deploya.

**Ejemplo:** 
```shell
deploy(arg1, arg2, arg3, tx)
```
En este caso arg1, arg2 y arg3 son 3 parametros que estarian en el constructor de nuestro smart contract y a su vez le estariamos mandando una TX al contrato.

La TX puede tener datos propios de una TX como lo son:
- GAS PRICE
- GAS LIMIT
- VALUE
- DATA
