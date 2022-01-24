let cart = {};
document.querySelectorAll('.add-to-cart').forEach(function(element){
    element.onclick = addToCart;
});

function addToCart(){
    let itemId = this.dataset.goods_id;
    if (cart[itemId]) {
        cart[itemId]++;
    }
    else {
        cart[itemId] = 1;
    }
    console.log(cart);
    ajaxGetGoodsInfo();
}

function ajaxGetGoodsInfo(){
    fetch('/get-goods-info',{
        method:"POST",
        headers:{
            'Accept':'application/json',
            'Content-type':'application/json'
        },
        body:JSON.stringify({key: Object.keys(cart)})
    }).then(response => response.text())
      .then(texted => console.log('texted = ',texted))
}