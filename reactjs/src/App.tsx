import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useAnchorWallet, AnchorWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { clusterApiUrl, Connection, Enum, Keypair, AccountMeta, SystemProgram, PublicKey} from '@solana/web3.js';
import React, { FC, ReactNode, useMemo, useRef } from 'react';
import idl from './istm.json';
import { Buffer } from 'buffer';

require('./assets/css/App.css');
require('@solana/wallet-adapter-react-ui/styles.css');


// @ts-ignore
window.Buffer = Buffer;

const App: FC = () => {
    return (
        <Context>
            <Content />
        </Context>
    );
};

const Context: FC<{ children: ReactNode }> = ({ children }) => {

    const network = WalletAdapterNetwork.Devnet;
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new UnsafeBurnerWalletAdapter(),
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

var wallet: AnchorWallet | undefined;

const Content: FC = () => {
    wallet = useAnchorWallet();

    return (
        <div className="App">
            <WalletMultiButton />
        </div>
    );
};


const App2: FC = () => {
    return (
        <Context>
            <Content2 />
        </Context>
    );
};

export {App, App2};

const Content2: FC = () => {

    const todoData = useRef(null);
    const [msg_success, set_msg_success] = React.useState( false );
    const [msg_error, set_msg_error] = React.useState( false );
    const [resource_account, set_resource_account] = React.useState( '' );

    function getProvider() {
        
        if (!wallet) {
            return null;
        }
        // const network = "http://127.0.0.1:8899";
        // const network = "https://api.devnet.solana.com";
        // const network = "https://api.mainnet-beta.solana.com";
        // const network = "https://solana-mainnet.phantom.tech/";
        // const network = "https://api.metaplex.solana.com/";
        const network = "https://rpc.helius.xyz/?api-key=f9c25cdd-a114-4aa2-85c1-54e7e6daea55";

        const connection = new Connection(network, "processed");
        console.log(connection);
        const provider = new AnchorProvider(
            connection, wallet, {'preflightCommitment': "processed"},
        );

        return provider;
    }

    /*
    [1, 0, 0, 0, 0] - Operation::Create
    [2, 0, 0, 0, 0, 0] - Operation::Create, Operation::Create
    [1, 0, 0, 0, 1, 255, 255, 255, 255, 0, 0, 0, 0] - Operation::Edit { size: 0xffffffff }
    [1, 0, 0, 0, 1, 255, 255, 255, 255, 255, 255, 255, 255] - Operation::Edit { size: 0xffffffffffffffff }
    [2, 0, 0, 0, 0, 1, 255, 255, 255, 255, 255, 255, 255, 255] - Operation::Create, Operation::Edit { size: 0xffffffffffffffff }
    [2, 0, 0, 0, 1, 255, 255, 255, 255, 255, 255, 255, 255, 0] - Operation::Edit { size: 0xffffffffffffffff }, Operation::Create
    [1, 0, 0, 0, 2, 64, 64, 64, 64, 64, 64, 64, 64, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] - Operation::Complete { size: 0x4040404040404040, data: [0, 0, 0, 0, 0, 0, 0, 0]}
    [1, 0, 0, 0, 2, 64, 64, 64, 64, 64, 64, 64, 64, 3, 0, 0, 0, 1, 2, 3] - Operation::Complete {offset: 0x4040404040404040, data: [1, 2, 3]}
    [1, 0, 0, 0, 2, 64, 64, 64, 64, 64, 64, 64, 64, 6, 0, 0, 0, 1, 2, 3, 4, 5, 6] - Operation::Complete {offset: 0x4040404040404040, data: [1, 2, 3, 4, 5, 6]}
    [1, 0, 0, 0, 2, 64, 64, 64, 64, 64, 64, 64, 64, 12, 0, 0, 0, 1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6] - Operation::Complete {offset: 0x4040404040404040, data: [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6]}
    [1, 0, 0, 0, 3] - Operation::Seal
    */
    
    function p64(number: number) {
        var arr = [];
        for (var i=0, j=1; i<8; i++, j *= 0x100) {
            arr.push((number / j) & 0xff);
        }
        return arr
    }

    function p32(number: number) {
        var arr = [];
        for (var i=0, j=1; i<4; i++, j *= 0x100) {
            arr.push((number / j) & 0xff);
        }
        return arr
    }    
    
    function encode_op_create() {
        return [0]
    }

    function encode_op_seal() {
        return [3]
    }

    function encode_op_edit(size: number) {
        var arr = [1];
        arr = arr.concat(p64(size));
        return arr
    }

    function encode_op_complete(offset: number, data: string) {
        var arr = [2];
        arr = arr.concat(p64(offset));
        var arr_data = data.split("").map(function(item) {
            return item.charCodeAt(0);
        });
        arr = arr.concat(p32(data.length))
        arr = arr.concat(arr_data);
        return arr
    }

    function istm_operations(user_todo_data: string) {

        var op_counter = 0;
        var data = [0, 0, 0, 0];

        // Operation1: Create
        var tmp_op = encode_op_create();
        data = data.concat(tmp_op);
        op_counter += 1;

        // Operation1: Edit
        var new_size = user_todo_data.length
        tmp_op = encode_op_edit(new_size + 32);
        data = data.concat(tmp_op);
        op_counter += 1;

        // Operation1: Complete
        tmp_op = encode_op_complete(32, user_todo_data);
        data = data.concat(tmp_op);
        op_counter += 1;

        // Operation1: Seal
        tmp_op = encode_op_seal();
        data = data.concat(tmp_op);
        op_counter += 1;

        // Update Operation Counter
        data[0] = op_counter;

        return data;
    }

    async function swearToMyself(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        console.log("Running on Mainnet [2]");
        e.preventDefault();
        var user_todo_data = "";

        if (todoData.current != null){
            user_todo_data = todoData.current['value'];
        }

        const provider = getProvider()
        if (!provider) {
            alert("Please connect a wallet!");
            throw("Provider is null");
        }

        const a = JSON.stringify(idl);
        const b = JSON.parse(a);
        const program = new Program(b, idl.metadata.address, provider);

        // Get user input and serialize it
        var params = Buffer.from(istm_operations(user_todo_data));

        
        const new_resource_acc = Keypair.generate();  // the account that will be created and hold the 0.3 SOL

        let res_acc_meta : AccountMeta = {
            pubkey: new_resource_acc.publicKey,
            isSigner: false,
            isWritable: true,
        };

        try {
            await program.rpc.createList( params, {
                accounts: {
                    user: provider.wallet.publicKey, // user that pays for the transaction
                },
                signers: [new_resource_acc],
                remainingAccounts: [res_acc_meta, res_acc_meta, res_acc_meta, res_acc_meta], 
                instructions: [
                    SystemProgram.createAccount({
                        fromPubkey: provider.wallet.publicKey,
                        newAccountPubkey: new_resource_acc.publicKey,
                        space: 32,
                        lamports: 300000000,
                        programId: new PublicKey(idl.metadata.address), // owner = program ID
                    }),
                ],
            });

            console.log('Transaction successful!');
            set_resource_account("["+new_resource_acc.secretKey.toString()+"]");
            console.log("ISTM List Created Successfully and stored under the given account.");
            set_msg_error(false);
            set_msg_success(true);
        } catch (err) {
            console.log("Transaction error: ", err);
            console.log("An error occured while creating the ISTM List.");
            set_msg_success(false);
            set_msg_error(true);
        }
    }

    return (
        <div className="App2">

            <form className="php-email-form">
                <div className="row">
                    <div className="form-group col-md-12">
                    <label>Name:</label>
                    <input type="text" name="name" className="form-control" id="name" placeholder="Your Name" required />
                    </div>
                </div>
                <div className="form-group mt-3">
                    <label >Enter your 2023 resolutions and goals:</label>
                    <textarea ref={todoData} className="form-control" name="message" rows={11} required></textarea>
                </div>
                <div className="my-3">
                    {msg_error && (
                    <div className="error-message display_result">Transaction Error</div>
                    )}
                    {msg_success && (
                    <div className="sent-message display_result">Transaction Successful. Good Luck! <br /> {resource_account} </div>
                    )}
                </div>
                <div className="text-center">
                    <button onClick={swearToMyself} type="submit" >Seal it!</button>
                </div>
            </form>
        </div>
    );
};