import { ABIDataTypes } from '@btc-vision/transaction';
import { BitcoinAbiTypes, type BitcoinInterfaceAbi, type CallResult, type IOP_NETContract } from 'opnet';
import type { Address } from '@btc-vision/transaction';

export interface ISatoshisWall extends IOP_NETContract {
    postMessage(chunk1: bigint, chunk2: bigint): Promise<CallResult<{ success: boolean }>>;
    getMessageCount(): Promise<CallResult<{ count: bigint }>>;
    getMessage(
        index: bigint,
    ): Promise<CallResult<{ sender: Address; blockNumber: bigint; chunk1: bigint; chunk2: bigint }>>;
    getMessages(offset: bigint, limit: bigint): Promise<CallResult<{ data: Uint8Array }>>;
    getTotalRaised(): Promise<CallResult<{ totalRaised: bigint }>>;
    hasPosted(addr: string): Promise<CallResult<{ posted: boolean }>>;
}

export const SatoshisWallABI: BitcoinInterfaceAbi = [
    {
        name: 'postMessage',
        type: BitcoinAbiTypes.Function,
        inputs: [
            { name: 'chunk1', type: ABIDataTypes.UINT256 },
            { name: 'chunk2', type: ABIDataTypes.UINT256 },
        ],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
    },
    {
        name: 'getMessageCount',
        type: BitcoinAbiTypes.Function,
        inputs: [],
        outputs: [{ name: 'count', type: ABIDataTypes.UINT256 }],
    },
    {
        name: 'getMessage',
        type: BitcoinAbiTypes.Function,
        inputs: [{ name: 'index', type: ABIDataTypes.UINT256 }],
        outputs: [
            { name: 'sender', type: ABIDataTypes.ADDRESS },
            { name: 'blockNumber', type: ABIDataTypes.UINT256 },
            { name: 'chunk1', type: ABIDataTypes.UINT256 },
            { name: 'chunk2', type: ABIDataTypes.UINT256 },
        ],
    },
    {
        name: 'getMessages',
        type: BitcoinAbiTypes.Function,
        inputs: [
            { name: 'offset', type: ABIDataTypes.UINT256 },
            { name: 'limit', type: ABIDataTypes.UINT256 },
        ],
        outputs: [{ name: 'data', type: ABIDataTypes.BYTES }],
    },
    {
        name: 'getTotalRaised',
        type: BitcoinAbiTypes.Function,
        inputs: [],
        outputs: [{ name: 'totalRaised', type: ABIDataTypes.UINT256 }],
    },
    {
        name: 'hasPosted',
        type: BitcoinAbiTypes.Function,
        inputs: [{ name: 'addr', type: ABIDataTypes.ADDRESS }],
        outputs: [{ name: 'posted', type: ABIDataTypes.BOOL }],
    },
];
