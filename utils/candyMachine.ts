import * as anchor from "@project-serum/anchor";

import { MintLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { createInitializeMintInstruction, createMintToInstruction } from "@solana/spl-token";

import { CandyMachineState } from "./candyMachine.model"
import { PublicKey } from '@solana/web3.js';
import { sendTransactions } from "./candyMachine.helpers";

export const CANDY_MACHINE_PROGRAM = new PublicKey(
    "cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ"
);

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

const CIVIC = new PublicKey(
    'gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs',
);

const getNetworkToken = async (payer: anchor.web3.PublicKey, gatekeeperNetwork: any) => {
    return await anchor.web3.PublicKey.findProgramAddress(
        [
            payer.toBuffer(),
            Buffer.from('gateway'),
            Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
            gatekeeperNetwork.toBuffer(),
        ],
        CIVIC,
    );
};

export interface CollectionData {
    mint: anchor.web3.PublicKey;
    candyMachine: anchor.web3.PublicKey;
}

const getNetworkExpire = async (gatekeeperNetwork: any) => {
    return await anchor.web3.PublicKey.findProgramAddress(
        [gatekeeperNetwork.toBuffer(), Buffer.from('expire')],
        CIVIC,
    );
};

export const getCollectionAuthorityRecordPDA = async (
    mint: anchor.web3.PublicKey,
    newAuthority: anchor.web3.PublicKey,
): Promise<anchor.web3.PublicKey> => {
    return (
        await anchor.web3.PublicKey.findProgramAddress(
            [
                Buffer.from('metadata'),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mint.toBuffer(),
                Buffer.from('collection_authority'),
                newAuthority.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID,
        )
    )[0];
};

export const getCollectionPDA = async (
    candyMachineAddress: anchor.web3.PublicKey,
): Promise<[anchor.web3.PublicKey, number]> => {
    return await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from('collection'), candyMachineAddress.toBuffer()],
        CANDY_MACHINE_PROGRAM,
    );
};

const { SystemProgram } = anchor.web3;

/**
 * 
 * @param anchorWallet anchor wallet object containing the wallet details
 * @param candyMachineId candy machine id gotten after uploading nfts
 * @param connection 
 * @returns 
 */
export const getCandyMachineState = async (
    anchorWallet: anchor.Wallet,
    candyMachineId: anchor.web3.PublicKey,
    connection: anchor.web3.Connection
): Promise<CandyMachineState> => {
    const anchorProvider = new anchor.AnchorProvider(connection, anchorWallet, {
        preflightCommitment: "recent",
    });

    const idl = await anchor.Program.fetchIdl(CANDY_MACHINE_PROGRAM, anchorProvider) as anchor.Idl;


    const program = new anchor.Program(
        idl,
        CANDY_MACHINE_PROGRAM,
        anchorProvider
    );

    const state: any = await program.account.candyMachine.fetch(
        candyMachineId
    );

    const candyMachine = {
        id: candyMachineId,
        connection,
        program,
        state
    };

    const itemsAvailable = state.data.itemsAvailable.toNumber();
    const itemsRedeemed = state.itemsRedeemed.toNumber();
    const itemsRemaining = itemsAvailable - itemsRedeemed;

    let goLiveDate = state.data.goLiveDate.toNumber();
    goLiveDate = new Date(goLiveDate * 1000);

    return {
        candyMachine,
        itemsAvailable,
        itemsRedeemed,
        itemsRemaining,
        goLiveDate
    };
};

/**
 * 
 * @param wallet 
 * @param mint 
 * @returns 
 */
const getTokenWallet = async (
    wallet: anchor.web3.PublicKey,
    mint: anchor.web3.PublicKey
) => {
    return (
        await PublicKey.findProgramAddress(
            [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
            SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
        )
    )[0];
};

const getMasterEdition = async (
    mint: anchor.web3.PublicKey
): Promise<anchor.web3.PublicKey> => {
    return (
        await PublicKey.findProgramAddress(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mint.toBuffer(),
                Buffer.from("edition"),
            ],
            TOKEN_METADATA_PROGRAM_ID
        )
    )[0];
};

const createAssociatedTokenAccountInstruction = (
    associatedTokenAddress: anchor.web3.PublicKey,
    payer: anchor.web3.PublicKey,
    walletAddress: anchor.web3.PublicKey,
    splTokenMintAddress: anchor.web3.PublicKey
) => {
    const keys = [
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
        { pubkey: walletAddress, isSigner: false, isWritable: false },
        { pubkey: splTokenMintAddress, isSigner: false, isWritable: false },
        {
            pubkey: anchor.web3.SystemProgram.programId,
            isSigner: false,
            isWritable: false,
        },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        {
            pubkey: anchor.web3.SYSVAR_RENT_PUBKEY,
            isSigner: false,
            isWritable: false,
        },
    ];
    return new anchor.web3.TransactionInstruction({
        keys,
        programId: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
        data: Buffer.from([]),
    });
};

export const getMetadata = async (
    mint: anchor.web3.PublicKey
): Promise<anchor.web3.PublicKey> => {
    return (
        await PublicKey.findProgramAddress(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mint.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        )
    )[0];
};



const getCandyMachineCreator = async (candyMachineId: string) => {
    const CandyMachineID = new PublicKey(candyMachineId);
    return await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from('candy_machine'), CandyMachineID.toBuffer()],
        CANDY_MACHINE_PROGRAM,
    );
};

export const mintMultipleToken = async (
    candyMachine: any,
    payer: anchor.web3.PublicKey,
    quantity: number = 2
) => {
    try {
        const signersMatrix = [];
        const instructionsMatrix = [];

        for (let index = 0; index < quantity; index++) {
            const mint = anchor.web3.Keypair.generate();
            const token = await getTokenWallet(payer, mint.publicKey);
            const { connection } = candyMachine;
            const rent = await connection.getMinimumBalanceForRentExemption(
                MintLayout.span
            );
            const instructions = [
                anchor.web3.SystemProgram.createAccount({
                    fromPubkey: payer,
                    newAccountPubkey: mint.publicKey,
                    space: MintLayout.span,
                    lamports: rent,
                    programId: TOKEN_PROGRAM_ID,
                }),
                createInitializeMintInstruction(
                    mint.publicKey,
                    0,
                    payer,
                    payer,
                    TOKEN_PROGRAM_ID,
                ),
                createAssociatedTokenAccountInstruction(
                    token,
                    payer,
                    payer,
                    mint.publicKey
                ),
                createMintToInstruction(
                    mint.publicKey,
                    token,
                    payer,
                    1,
                    [],
                    TOKEN_PROGRAM_ID,
                ),
            ];
            const masterEdition = await getMasterEdition(mint.publicKey);
            const metadata = await getMetadata(mint.publicKey);

            const [candyMachineCreator, creatorBump] = await getCandyMachineCreator(
                candyMachine.id,
            );

            const accounts = {
                candyMachine: candyMachine.id,
                candyMachineCreator,
                payer: payer,
                wallet: candyMachine.state.wallet,
                mint: mint.publicKey,
                metadata,
                masterEdition,
                mintAuthority: payer,
                updateAuthority: payer,
                tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
                recentBlockhashes: anchor.web3.SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
                instructionSysvarAccount: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
            }

            const instruction = await candyMachine.program.instruction.mintNft(creatorBump, {
                accounts
            })
            instructions.push(
                instruction
            );

            const signers: anchor.web3.Keypair[] = [mint];


            signersMatrix.push(signers);
            instructionsMatrix.push(instructions);
        }

        return await sendTransactions(
            candyMachine.program.provider.connection,
            candyMachine.program.provider.wallet,
            instructionsMatrix,
            signersMatrix
        );
    } catch (err) {
        console.log(err)
    }

};

export const candyAnchorWallet =() => {
    const dummy_key_pair = new anchor.web3.Keypair();
    const walletWrapper = new anchor.Wallet(dummy_key_pair);
    return({walletWrapper})
}
    

export const mintToken = async (
    candyMachine: any,
    payer: anchor.web3.PublicKey,
    reference: string
) => {
    try {
        const mint = anchor.web3.Keypair.generate();
        const userTokenAccountAddress = await getTokenWallet(payer, mint.publicKey);
        const { connection } = candyMachine;
        const rent = await connection.getMinimumBalanceForRentExemption(
            MintLayout.span
        );
        //console.log("MINT:", mint)
        const instructions = [
            anchor.web3.SystemProgram.createAccount({
                fromPubkey: payer,
                newAccountPubkey: mint.publicKey,
                space: MintLayout.span,
                lamports: rent,
                programId: TOKEN_PROGRAM_ID,
            }),
            createInitializeMintInstruction(
                mint.publicKey,
                0,
                payer,
                payer,
                TOKEN_PROGRAM_ID,
            ),
            createAssociatedTokenAccountInstruction(
                userTokenAccountAddress,
                payer,
                payer,
                mint.publicKey
            ),
            createMintToInstruction(
                mint.publicKey,
                userTokenAccountAddress,
                payer,
                1,
                [],
                TOKEN_PROGRAM_ID,
            ),
        ];

        const masterEdition = await getMasterEdition(mint.publicKey);
        const metadata = await getMetadata(mint.publicKey);

        const [candyMachineCreator, creatorBump] = await getCandyMachineCreator(
            candyMachine.id,
        );

        const accounts = {
            candyMachine: candyMachine.id,
            candyMachineCreator,
            payer: payer,
            wallet: candyMachine.state.wallet,
            mint: mint.publicKey,
            metadata,
            masterEdition,
            mintAuthority: payer,
            updateAuthority: payer,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
            recentBlockhashes: anchor.web3.SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
            instructionSysvarAccount: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        }

        const instruction = await candyMachine.program.instruction.mintNft(creatorBump, {
            accounts
        })
        instructions.push(
            instruction
        );

        const [collectionPDA] = await getCollectionPDA(candyMachine.id);
        const collectionPDAAccount =
            await candyMachine.program.provider.connection.getAccountInfo(
                collectionPDA
            );

        if (collectionPDAAccount && candyMachine.state.retainAuthority) {
            try {
                const collectionData =
                    (await candyMachine.program.account.collectionPda.fetch(
                        collectionPDA
                    )) as CollectionData;
                console.log(collectionData);
                const collectionMint = collectionData.mint;
                const collectionAuthorityRecord = await getCollectionAuthorityRecordPDA(
                    collectionMint,
                    collectionPDA
                );
                console.log(collectionMint);
                if (collectionMint) {
                    const collectionMetadata = await getMetadata(collectionMint);
                    const collectionMasterEdition = await getMasterEdition(
                        collectionMint
                    );

                    const setCollectionInst =
                        await candyMachine.program.instruction.setCollectionDuringMint({
                            accounts: {
                                candyMachine: candyMachine.id,
                                metadata,
                                payer: payer,
                                collectionPda: collectionPDA,
                                tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
                                instructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
                                collectionMint,
                                collectionMetadata,
                                collectionMasterEdition,
                                authority: candyMachine.state.authority,
                                collectionAuthorityRecord,
                            },
                        });

                    setCollectionInst.keys.push({
                        pubkey: new PublicKey(reference),
                        isSigner: false,
                        isWritable: false,
                    });

                    instructions.push(setCollectionInst);
                }
            } catch (error) {
                console.error(error);
            }
        }
        
        const signers: anchor.web3.Keypair[] = [mint];

        return { instructions, signers };
    } catch (err) {
        console.log(err)
    }

};