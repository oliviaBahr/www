---
title: Sandbox spec for development
description: ...
---

# Changes to implement and write

## Jokers

<something about rotating jokers...>

### Magnet
Added back to joker pool.
Self destructs after 5 turns.

### The Order
Old effect:
                    "{X:mult,C:white} X3 Mult if played",
                    "hand contains",
                    "a Straight"

New effect:
"{X:mult,C:white} X4 Mult if played",
"hand contains",
"a Straight and no face cards"

### Loyalty Card
Old effect:
                    "{X:red,C:white} X4 Mult every",
                    "{C:attention}6{} hands played",

New effect:
X6 mult every 4 hands played with ____
(hand selected upon purchase)

### Misprint
Old effect:
+0 to +23 mult

New effect:
-23 to +46 mult
Mult revealed on purchase
Range doubled by Oops All 6s

### Castle
Old effect:
                    "This Joker gains {C:chips}+3{} Chips",
                    "per discarded {V:1}#2#{} card,",
                    "suit changes every round",
                    "{C:inactive}(Currently {C:chips}+#3#{C:inactive} Chips)",


New effect:
                    "This Joker gains {C:chips}+10{} Chips",
                    "per discarded {V:1}#2#{} card,",
                    "suit never changes",
                    "{C:inactive}(Currently {C:chips}+#3#{C:inactive} Chips)",


### Mail-in rebate
Old effect:
                    "Earn {C:money}$5{} for each",
                    "discarded {C:attention}#2#{}, rank",
                    "changes every round",


New effect:
"Earn {C:money}$7{} for each",
"discarded {C:attention}#2#{}, rank",
"never changes",

### Square Joker
Old effect:
                    "This Joker gains {C:chips}+4{} Chips",
                    "if played hand has",
                    "exactly {C:attention}4{} cards",
                    "{C:inactive}(Currently {C:chips}#1#{C:inactive} Chips)",

New effect:
                    "This Joker gains {C:chips}+8{} Chips",
                    "if played hand has",
                    "exactly {C:attention}4{} cards",
                    Starts with 64 chips
                    "{C:inactive}(Currently {C:chips}#1#{C:inactive} Chips, only applied if played hand has exactly {C:attention}4{} cards)",



### Throwback
Old effect:
                    "{X:mult,C:white} X0.25 {} Mult for each",
                    "{C:attention}Blind{} skipped this run",
                    "{C:inactive}(Currently {X:mult,C:white} X#2# {C:inactive} Mult)",

New effect:
                    "{X:mult,C:white} X0.25 {} Base Mult for each",
                    "{C:attention}Blind{} skipped this run",
                    "X0.75 additional mult next Blind"
                    "Loses X0.75 mult when blind not skipped"
                    "{C:inactive}(Currently {X:mult,C:white} X#2# {C:inactive} Mult)",


### Vampire
Old effect:
                    "This Joker gains {X:mult,C:white} X0.1 {} Mult",
                    "per scoring {C:attention}Enhanced card{} played,",
                    "{C:inactive}(Currently {X:mult,C:white} X#2# {C:inactive} Mult)",

New effect:
"This Joker gains {X:mult,C:white} X0.2 {} Mult",
"per scoring {C:attention}Enhanced card{} played,",
"transforms played card into {C:attention}Stone",
"played stone cards give $3",
"{C:inactive}(Currently {X:mult,C:white} X#2# {C:inactive} Mult)",

### Steel Joker
Old effect:
                    "Gives {X:mult,C:white} X0.2 {} Mult",
                    "for each {C:attention}Steel Card",
                    "in your {C:attention}full deck",
                    "{C:inactive}(Currently {X:mult,C:white} X#2# {C:inactive} Mult)",

New effect:
Steel cards are retriggered when played

### Baseball Card:
Old effect:
                    "{C:green}Uncommon{} Jokers",
                    "each give {X:mult,C:white} X1.5 {} Mult",

New effect:
                    "{C:green}Uncommon{} Jokers",
                    "each give {X:mult,C:white} X2 {} Mult",

### Idol:
Old effect:
                    "Each played {C:attention}#2#",
                    "of {V:1}#3#{} gives",
                    "{X:mult,C:white} X2 {} Mult when scored",
                    "{s:0.8}Card changes every round",


New effect:

Randomly picks one of three idols to put in pool:

Zealot Idol:
Suit-blind purist!
Each {C:attention}#1#{} gives {X:mult,C:white} X1.5{} Mult when scored
Card changes every round
{s:0.8}SUIT-BLIND PURIST!!!

Tantrum Idol:
Each round, gains X0.5 mult
Starts at 1X mult
Charge reset when played
Card changes every round
{s:0.8}Building STEAM for EXPLOSIVE RELEASE!!!

Meta Idol:
Your most common card gives {X:mult,C:white} X#3#{} Mult when scored
X0.05 {C:inactive}Mult per {C:attention}#1#{} of {V:1}#2#{} in your deck
{s:0.8 TODO}

## Spectral Cards

### Ouija
Old effect:
```
                text = {
                    "Converts all cards",
                    "in hand to a single",
                    "random {C:attention}rank",
                    "{C:red}-1{} hand size",
                },
```

New effect:
```
				text = {
					"Destroy {C:attention}#1#{} random cards,",
					"then convert all remaining",
					"cards to a single random {C:attention}rank",
				},
```

### Ectoplasm
Old effect:
```
                text = {
                    "Add {C:dark_edition}Negative{} to",
                    "a random {C:attention}Joker,",
                    "{C:red}-#1#{} hand size",
                },
```

New effect:
```

					"Add {C:dark_edition}Negative{} to",
					"a random {C:attention}Joker,",
					"Randomly apply one of:",
					"{C:red}-1{} hand, {C:red}-1{} discard, or {C:red}-1{} hand size",
				},
			},
```
