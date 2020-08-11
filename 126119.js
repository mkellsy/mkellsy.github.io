onmessage = function(event) {
    this.duration = event.data.duration;

    if (!this.duration || this.duration <= 0) {
        this.duration = 1000;
    }

    const timer = function timer() {
        postMessage({
            date: new Date()
        });
    
        setTimeout(timer, this.duration);
    }

    timer();
}
