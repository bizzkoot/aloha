class BeadMovements {
    static moveTopBead(bead, activate) {
        if (activate) {
            bead.classList.add('active');
        } else {
            bead.classList.remove('active');
        }
    }

    static moveBottomBeads(column, position) {
        const bottomBeads = column.querySelectorAll('.bottom-bead-4, .bottom-bead-3, .bottom-bead-2, .bottom-bead-1');
        
        // Clear all beads first
        bottomBeads.forEach(bead => bead.classList.remove('active'));
        
        // Activate beads from top down
        for (let i = 0; i < position; i++) {
            bottomBeads[i].classList.add('active');
        }
    }

    static setValue(column, value) {
        const topBead = column.querySelector('.top-bead');
        
        // Reset all beads
        this.moveTopBead(topBead, false);
        this.moveBottomBeads(column, 0);
        
        // Set new value
        if (value >= 5) {
            this.moveTopBead(topBead, true);
            value -= 5;
        }
        
        if (value > 0) {
            this.moveBottomBeads(column, value);
        }
    }
}
