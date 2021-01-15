
Vue.directive('draggable', {
    data: function () {
        return {
            event: null,
        }
    },
    bind: function(el) {
        this.event = new Event('draggable-onclick');

        //Watch out for orientation change and the element disappearing
        window.addEventListener("orientationchange", function(e) {
            //Orientation change, recalculate after 100ms for dom updates
            setTimeout(function() {
                //Orientation change, find the closest edge
                if(el.style.top != null && el.style.left != null) {
                    var position = el.getBoundingClientRect();

                    //Don't lose the element off the bottom/right screen
                    if(position.y > (window.screen.height - position.height)) {
                        el.style.top = (window.screen.height - position.height) + "px";
                    }
                    if(position.x > (window.screen.width - position.width)) {
                        el.style.left = (window.screen.width - position.width) + "px";
                    }
                }
            }, 200);

        });

        el.style.position = 'absolute';
        var self, startX, startY, initialMouseX, initialMouseY, deadzoned;
        self = this;
        function onMove(x, y) {
            var dx = x - initialMouseX;
            var dy = y - initialMouseY;

            //30x30 deadzone to
            if(Math.abs(dx) < 30 && Math.abs(dy) < 30) {
                return false;
            }

            deadzoned = false;
            //console.log("TOP: " + (startY + dy) + "LEFT: " + (startX + dx));

            el.style.cssText = 'top: ' + (startY + dy) + 'px !important;left: ' + (startX + dx) + 'px !important; right: unset !important; bottom: unset !important';
            el.setAttribute("is-dragging", true);
            return false;
        }

        function mousemove(e) {
            onMove(e.clientX, e.clientY);
        }

        function touchmove(e) {
            onMove(e.touches[0].clientX, e.touches[0].clientY);
        }

        function movedone(e) {
            if(deadzoned) {
                el.dispatchEvent(self.event);
            }
            //Dirty way to keep the attribute incase there's any trickle down events
            setTimeout(function() {
                el.removeAttribute("is-dragging");
            }, 100);
          }

          function mouseup(e) {
            document.removeEventListener('mousemove', mousemove);
            document.removeEventListener('mouseup', mouseup);

            movedone(e);
        }

        function touchend(e) {
            document.removeEventListener('touchmove', touchmove);
            document.removeEventListener('touchend', touchend);

            movedone(e);
        }

        el.addEventListener('mousedown', function(e) {
            deadzoned = true;
            startX = el.offsetLeft;
            startY = el.offsetTop;
            initialMouseX = e.clientX;
            initialMouseY = e.clientY;
            document.addEventListener('mousemove', mousemove);
            document.addEventListener('mouseup', mouseup);

            return false;
        });

        el.addEventListener('touchstart', function(e) {
            deadzoned = true;
            startX = el.offsetLeft;
            startY = el.offsetTop;
            initialMouseX = e.touches[0].clientX;
            initialMouseY = e.touches[0].clientY

            document.addEventListener('touchmove', touchmove);
            document.addEventListener('touchend', touchend);

            e.preventDefault();
            return false;
        });
    }
  });
