# Getting Started Guide

## Quick Start (5 minutes)

### Prerequisites
- [Freighter Wallet Extension](https://www.freighter.app/)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stellar Testnet account with some XLM

### Step 1: Install Freighter Wallet
1. Visit https://www.freighter.app/
2. Click "Install" and select your browser
3. Follow the installation prompts
4. Create or import a Stellar account

### Step 2: Fund Your Testnet Account
1. Visit https://laboratory.stellar.org/#account-creator
2. Paste your Stellar public key (from Freighter)
3. Click "Generate Testnet Account"
4. Receive 10,000 test XLM

### Step 3: Switch to Testnet
1. Open Freighter extension
2. Go to Settings → Preferences
3. Change network from "Mainnet" to "Testnet"
4. Confirm the switch

### Step 4: Access the App
**Live URLs:**
- Primary: https://frontend-iwkz8ejfu-yodhadigital331-8554s-projects.vercel.app
- Alias: https://frontend-eta-seven-24.vercel.app

### Step 5: Connect Wallet
1. Click "Connect Wallet" button
2. Freighter popup appears
3. Review permissions and click "Approve"
4. Your wallet is now connected!

### Step 6: Explore Features

#### As a Regular User
1. **View Candidates:** See all scholarship applicants
2. **Vote:** Click any candidate to vote (one vote per address)
3. **Check Balance:** See your XLM balance at the top

#### As an Admin (if you have admin access)
1. Click the ⚙️ gear icon
2. Enter any address as "admin" in simulation mode or use the admin panel
3. **Initialize Contract:** Set yourself as admin
4. **Approve Candidates:** Mark applications as approved
5. **End Voting:** Close the voting period

---

## Common Actions

### Apply for Scholarship
1. Click "Apply for Scholarship" button
2. Fill in your details:
   - Full Name
   - Major/Field of Study
   - Proposal Essay
   - Requested Amount (in XLM)
3. Click "Submit Application"
4. Approve transaction in Freighter
5. Application stored on blockchain!

### Vote for a Candidate
1. Browse the candidates grid
2. Click "Vote" button on candidate of choice
3. Confirm your selection
4. Approve transaction in Freighter
5. Vote recorded (cannot be changed)

### Change Contract Address
1. Click ⚙️ (Settings) icon
2. Paste new contract ID in the input field
3. Click "Update"
4. App reconnects to new contract

### Switch to Simulation Mode
1. Click ⚙️ (Settings) icon
2. Clear the contract ID field
3. Click "Reset to Simulation"
4. App switches to local demo mode

---

## Troubleshooting

### "Freighter wallet not found"
- **Solution:** Install Freighter extension from https://www.freighter.app/
- Refresh the page after installation

### "Insufficient balance for transaction"
- **Solution:** Fund your account with test XLM
- Visit: https://laboratory.stellar.org/#account-creator
- Paste your public key and generate account

### "Network switched to Mainnet"
- **Solution:** Switch Freighter back to Testnet
- Open Freighter → Settings → Preferences
- Select "Testnet" from network options

### "Transaction failed"
- Check your balance in Freighter
- Verify contract ID is correct (⚙️ settings)
- Try again or contact support

### "Contract address not found"
- Use the default Testnet contract provided
- Or deploy your own contract
- See DEPLOYMENT.md for instructions

### App not loading
- Clear browser cache (Ctrl+Shift+Del)
- Hard refresh page (Ctrl+F5)
- Try different browser
- Check internet connection

---

## Understanding the Interface

### Header
- **Left:** App title and logo
- **Center:** Voting status
- **Right:** Wallet address and XLM balance

### Main Content Area
- **Candidates Grid:** All scholarship applicants
- **Vote Buttons:** Click to vote for each candidate
- **Pending Count:** Admin view showing unapproved applications

### Admin Panel (when admin)
- **Pending Applications:** Approve button for each
- **Voting Control:** End or reopen voting period

### Recent Events Panel
- **Blockchain Events:** Timestamped transaction log
- **Real-time Updates:** Shows recent actions
- **Color Coding:** Info (blue), Success (green), Warning (yellow)

### Settings Panel (⚙️)
- **Contract ID:** Update contract address
- **Admin Mode Toggle:** Switch between roles
- **Update Button:** Save contract changes
- **Reset Button:** Return to demo mode

---

## Key Concepts

### What is Freighter Wallet?
Freighter is a browser extension that:
- Stores your Stellar private keys securely
- Never exposes keys to websites
- Signs transactions only when you approve
- Manages multiple accounts

### What is Stellar Testnet?
- **Test network** for trying blockchain apps
- **Free test XLM** from faucet
- **Same functionality** as mainnet
- **No real money** involved

### How Voting Works
1. **Each address gets 1 vote**
2. **Cannot be changed** once cast
3. **Candidates must be approved** before voting
4. **Admin can end voting period**
5. **Results are immutable** once period ends

### Smart Contract
- **On-chain code** that runs voting logic
- **Validates all rules** (no double voting, etc.)
- **Stores all data** immutably
- **Transparent** (everyone can verify)

---

## Security Tips

✅ **DO:**
- ✅ Keep your seed phrase safe
- ✅ Never share your private key
- ✅ Verify contract address before use
- ✅ Review transactions before approving
- ✅ Use official Freighter extension

❌ **DON'T:**
- ❌ Give your seed phrase to anyone
- ❌ Use public WiFi for transactions
- ❌ Click suspicious links
- ❌ Approve unknown transactions
- ❌ Share your private key online

---

## Next Steps

1. **Try Demo Mode** - Use simulation mode first
2. **Connect Wallet** - Test with small amounts
3. **Apply for Scholarship** - Submit your application
4. **Vote** - Help select scholarship recipients
5. **Monitor** - Check blockchain explorer for your transactions

---

## Support Resources

- **Freighter Help:** https://www.freighter.app/
- **Stellar Docs:** https://developers.stellar.org/
- **Blockchain Explorer:** https://stellar.expert/explorer/testnet
- **GitHub Issues:** https://github.com/sachinnit25/Scholarship-Voting-Platform/issues

---

**Happy voting! 🚀**

Last updated: June 29, 2026
