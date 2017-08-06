d = mvdom
document.addEventListener("DOMContentLoaded", function(event) {
	d.display("ShoppingView", d.first("#shopping"), core.getShoppingList())
})

d.register("ShoppingView",{
	create: function(){
    return `<div class='ShoppingView'>
              <div class="list"></div>
            </div>`
	},
					
	init: function(shoppingList, config){
			var view = this; // best practice 
			view.el; // this is the top parent element created for this view 
			// if return a Promise, the flow will wait until the promise is resolved 
	}, 
          
  // , 

	// schedules: [
	// 	{
	// 		performFn: function(){
	// 			var fullPath = new URL('adminbackend/GetLoggedInPlayers', window.location).pathname

	// 			var request = new GetLoggedInPlayersRequest()
	// 			GetLoggedInPlayersRequest.verify(request)
	// 			return ajax.post(fullPath, request).then(function(data) {
	// 			  GetLoggedInPlayersResponse.verify(data)
	// 			  return GetLoggedInPlayersResponse.fromObject(data)
	// 			}, function(error) {
	// 			  //um dunno...
	// 			  return {connected:false}
	// 			})
	// 		},

	// 		receiveFn: function(getLoggedInPlayersResponse){
	// 			var view = this
	// 			var namesEl = d.first(view.el,".names")
	// 			namesEl.innerHTML = ""

	// 			getLoggedInPlayersResponse.players.forEach(function(player) {
	// 				var nameDiv = document.createElement("div")
	// 				nameDiv.textContent = 
	// 				  "name=" + player.playerName + 
	// 				  " x=" + player.coordinate.x + 
	// 				  " y=" + player.coordinate.y + 
	// 				  " z=" + player.coordinate.z;
	// 				namesEl.appendChild(nameDiv)
	// 			})

	// 			console.log(getLoggedInPlayersResponse)
	// 		}
	// 	}
	// ]

});
