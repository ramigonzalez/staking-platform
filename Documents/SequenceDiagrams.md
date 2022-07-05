# Sequence Diagrams

Sequence diagram for the most interesting functions in the contracts:

## Token Minting
```mermaid
sequenceDiagram

Wallet 1->>Vault: mint(amount)
activate Vault
alt Sender is not Admin
    Vault-->>Wallet 1: Not An Admin!!
else Sender is Admin
    alt No previous request
        Vault-->>Wallet 1: Request Created
    else Equals previous request
        Vault->>TokenContract: mint(amount)
        activate TokenContract
        TokenContract->>TokenContract: transfer(amount, Vault)
        TokenContract->>Transfer: emit Transfer(0, Valut, amount)
        activate Transfer
        Transfer-->>TokenContract: 
        deactivate Transfer
        TokenContract-->>Vault: 
        deactivate TokenContract
        Vault-->>Wallet 1: Tokens Minted
    end
end
deactivate Vault
```

## Token Transfer
```mermaid
sequenceDiagram

Wallet 1->>TokenContract: transfer(to,value)
activate TokenContract
TokenContract->>TokenContract: balanceOf(msg.sender)
alt No balance
    TokenContract-->>Wallet 1: reverted, insufficient tokens
else Sufficient balance
    TokenContract->>Transfer: emit Transfer(msg.sender, to, value)
    activate Transfer
    Transfer-->>TokenContract: 
    deactivate Transfer
    TokenContract-->>Wallet 1: true, tokens transfered
end
deactivate TokenContract
```

## Token Transfer From
```mermaid
sequenceDiagram

Wallet 1->>TokenContract: transferFrom(from,to,value)
activate TokenContract
TokenContract->>TokenContract: allowance(from,msg.sender)
alt Insufficient Allowance
    TokenContract-->>Wallet 1: reverted, insufficient allowance
else Sender is ap
    TokenContract->>TokenContract: balanceOf(from)
    alt No balance
        TokenContract-->>Wallet 1: reverted, insufficient tokens
    else Sufficient balance
        TokenContract->>Transfer: emit Transfer(from, to, value)
        activate Transfer
        Transfer-->>TokenContract: 
        deactivate Transfer
        TokenContract-->>Wallet 1: true, tokens transfered
    end
end
deactivate TokenContract
```

## Token Burn
```mermaid
sequenceDiagram
Wallet 1->>Vault: burn(amount)
activate Vault
Vault->>Vault: isContract(msg.sender)
alt Is a contract
    Vault-->>Wallet 1: reverted, cannot be called by a contract
else Is not a contract
    alt amount = 0
        Vault-->>Wallet 1: reverted, Amount must be greater than 0
    else amount > 0
        Vault->>Vault: address(this).balance
        Vault->>TokenContract: decimals()
        activate TokenContract
        TokenContract-->>Vault: 18
        deactivate TokenContract
        alt not enough ethers
            Vault-->>Wallet 1: reverted, Vault balance must be higher than amount
        else enough ethers
            Vault->>TokenContract: burn(amount, msg.sender)
            activate TokenContract
            alt Is not Vault address
                TokenContract-->>Wallet 1: reverted, Only Vault call this function
            else Is Vault addres
                TokenContract-->>TokenContract: *increase balance and totalSupply*
                TokenContract->>Transfer: emit Transfer(from, address(0), value)
                activate Transfer
                deactivate Transfer
            end
            TokenContract-->>Vault: bool
            deactivate TokenContract

            alt amount = 0
                Vault-->>Vault: payable(msg.sender).transfer(ethers)
            end

            Vault->>Burn: emit Burn(msg.sender, amount)
            activate Burn
            deactivate Burn
        end  
    end
end
deactivate Vault
```

## Change APR
```mermaid
sequenceDiagram
Wallet 1->>Vault: setAPR(value)
activate Vault
alt APR value > 100
    Vault-->>Wallet 1: reverted, APR value is invalid
else APR value valid
    Vault->>Farm: setAPR(value)
    activate Farm
    alt Is not Vault address
        Farm-->>Wallet 1: reverted, Only Vault call this function
    else Is Vault addres
        Farm-->>Farm: *update currentAPR*
        deactivate Farm
    end
end
deactivate Vault
```
