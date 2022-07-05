# Sequence Diagrams

Sequence diagram for the most interesting functions in the contracts:


## Token Minting
```mermaid
sequenceDiagram

Wallet 1->>Vault: mint(amount)
activate Vault
alt Sender is not Admin
    Vault-->>Wallet 1: revert, Not an admin
else Sender is Admin
    alt not valid TokenContract address
        Vault-->>Wallet 1: revert, not valid TokenContract address
    else valid TokenContract address
        alt mint sender is address(0)
            Vault-->>Vault: *set sender and timestamp*
            Vault-->>Wallet 1: return
        end

        alt change of timesamp > 5 minutes
            Vault-->>Vault: *set sender and timestamp*
            Vault-->>Wallet 1: return
        end

        alt _mint.sender == msg.sender
            Vault-->>Wallet 1: Signer must be different
        else _mint.sender != msg.sender
            Vault->>TokenContract: mint(amount)
            activate TokenContract
            alt msg.sender != vaultAddress
                TokenContract-->>Wallet 1: revert, Only Vault can call this function
            else a
                alt amount == 0
                    TokenContract-->>Wallet 1: revert, amount must be greater than 0
                else amount > 0
                    TokenContract-->>TokenContract: *increase balance and totalSupply*
                    TokenContract->>Transfer: emit Transfer(address(0), Vault, amount)
                    activate Transfer
                    deactivate Transfer
                end
            end
            deactivate TokenContract
        end
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
alt is not valid TokenContract address
    Vault-->>Wallet 1: reverted, not valid TokenContract address
else is valid
    Vault->>Vault: isContract(msg.sender)
    alt Is a contract
        Vault-->>Wallet 1: reverted, cannot be called by a contract
    else Is not a contract
        alt amount == 0
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
                    TokenContract-->>TokenContract: *decrease balance and totalSupply*
                    TokenContract->>Transfer: emit Transfer(from, address(0), value)
                    activate Transfer
                    deactivate Transfer
                end
                TokenContract-->>Vault: bool
                deactivate TokenContract

                alt success == true
                    Vault-->>Vault: payable(msg.sender).transfer(ethers)
                end

                Vault->>Burn: emit Burn(msg.sender, amount)
                activate Burn
                deactivate Burn
            end  
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
