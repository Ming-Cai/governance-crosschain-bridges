import { Signer, BigNumber, Bytes } from 'ethers';
import { tEthereumAddress } from '../../helpers/types';
import { AaveGovernanceV2 } from '../../typechain';
import { expect } from 'chai';

export const expectProposalState = async (
  aaveGovernanceV2: AaveGovernanceV2,
  proposalId: number,
  state: number
): Promise<void> => {
  expect(await aaveGovernanceV2.getProposalState(proposalId)).to.be.equal(state);
};

export const createProposal = async (
  aaveGovernanceV2: AaveGovernanceV2,
  signer: Signer,
  executor: string,
  targets: tEthereumAddress[],
  values: BigNumber[],
  signatures: string[],
  calldatas: Bytes[] | string[],
  withDelegatecalls: boolean[],
  ipfsHash: string,
  params?: any
) => {
  let proposalTx;
  if (params) {
    proposalTx = await aaveGovernanceV2
      .connect(signer)
      .create(
        executor,
        targets,
        values,
        signatures,
        calldatas,
        withDelegatecalls,
        ipfsHash,
        params
      );
  } else {
    proposalTx = await aaveGovernanceV2
      .connect(signer)
      .create(executor, targets, values, signatures, calldatas, withDelegatecalls, ipfsHash);
  }

  // await expect(proposalTx).to.emit(aaveGovernanceV2, 'ProposalCreated');
  const proposalTxReceipt = await proposalTx.wait();
  console.log(`Proposal creation transactionHash: ${proposalTxReceipt.transactionHash}`);
  const proposalLog = aaveGovernanceV2.interface.parseLog(proposalTxReceipt.logs[0]);
  return aaveGovernanceV2.interface.decodeEventLog(
    proposalLog.eventFragment,
    proposalTxReceipt.logs[0].data
  );
};

export const triggerWhaleVotes = async (
  aaveGovernanceV2: AaveGovernanceV2,
  whales: Signer[],
  proposalId: BigNumber,
  yesOrNo: boolean,
  params?: any
): Promise<void> => {
  const vote = async (signer: Signer) => {
    const tx = await aaveGovernanceV2.connect(signer).submitVote(proposalId, yesOrNo, params);
    await tx.wait();
  };
  const promises = whales.map(vote);
  await Promise.all(promises);
};

export const queueProposal = async (
  aaveGovernanceV2: AaveGovernanceV2,
  proposalId: BigNumber,
  params?: any
) => {
  const queueTx = await aaveGovernanceV2.queue(proposalId, params);
  // await expect(queueTx).to.emit(aaveGovernanceV2, 'ProposalQueued');
  const queueTxReceipt = await queueTx.wait();
  const queueLog = aaveGovernanceV2.interface.parseLog(queueTxReceipt.logs[1]);
  return aaveGovernanceV2.interface.decodeEventLog(
    queueLog.eventFragment,
    queueTxReceipt.logs[1].data
  );
};
