let Engine = Matter.Engine,
    World = Matter.World,
    Vector = Matter.Vector,
    Render = Matter.Render,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Events = Matter.Events,
    Composite = Matter.Composite;
let engine=null;
// upside is about Matter.Js
let appWidth,
    appHeight,
    wholeHeight;        // app属性
let me=null,
    wall=null,
    dwall=null,
    aim=null;           // 地图元素
let canBounce = false;  // 是否可以使用跳跃
let firstStart = true;  // 是否还未开始移动
let historyPath = [];   // 历史路径
let pasts = [];         // 之前的影子
let interval=null;      // 现在正在跑的interval
const savePathInterval=1; // 记录路径间隔


// 物理引擎
function initScene() {
    // 创建引擎
    engine = Engine.create({
        // enableSleeping: true    // 开启睡眠模式，提高引擎效率
    });
    // Render配置项
    let options = {
        width: appWidth,
        height: appHeight,
        wireframes: true,
        background: '#0f0f13',
        hasBounds: true,
        showVelocity: true,     // DeBug项 显示每个物品上的矢量
        // showIds: true           // DeBug项 显示每个物品的ID
    };

    // 初始化地图
    initMap();

    // 安全墙体内部成员ID
    let wallsId = Composite.allBodies(wall).map(x => x.id);
    // 危险墙体内部成员ID
    let dwallsId = Composite.allBodies(dwall).map(x => x.id);
    // aim墙体内部成员ID
    let aimsId = Composite.allBodies(aim).map(x => x.id);


    // 把元素添加到世界中
    World.add(engine.world, [me, aim, wall, dwall]);

    // 创建Render
    let render = Render.create({
        element: document.body,
        engine: engine,
        options: options
    });

    // 运行引擎和Render
    Engine.run(engine);
    Render.run(render);

    // 监听碰撞事件
    Events.on(engine, "collisionStart", (evt) => {
        evt.source.broadphase.pairsList.forEach( val => {
            // 判断me和安全墙体相撞
            if(
                (val[0].id===me.id && wallsId.indexOf(val[1].id)!==-1) ||
                (val[1].id===me.id && wallsId.indexOf(val[0].id)!==-1)
            ) {
                canBounce = true;
            }
            // 判断me和危险墙体相撞
            if(
                (val[0].id===me.id && dwallsId.indexOf(val[1].id)!==-1) ||
                (val[1].id===me.id && dwallsId.indexOf(val[0].id)!==-1)
            ) {
                death();
            }
            // 判断游戏成功
            if(
                (val[0].id===me.id && aimsId.indexOf(val[1].id)!==-1) ||
                (val[1].id===me.id && aimsId.indexOf(val[0].id)!==-1)
            ) {
                aimIt();
            }
        });
    });
}

let max1 = 0;

// 摇杆
function initNipple() {
    let controller = nipplejs.create({
        zone: document.getElementById('static'),
        mode: 'static',
        position: {left: '50%', top: 'calc(100% - 70px)'},
        color: 'rgb(180,180,180)'
    });
    controller.on('move', function(evt, data) {
        let x = data.position.x-appWidth/2;
        // 跳跃
        if(data.angle.degree<=90+30 && data.angle.degree>=90-30 && data.distance>=40) {
            bounce();
        }
        let velocity = Math.sqrt(me.velocity.x*me.velocity.x + me.velocity.y*me.velocity.y);
        // if(max1<velocity) {
        //     console.log(velocity);
        //     max1=velocity;
        // }
        let force;
        let deac=0.05;
        if(velocity>20) {
            // 给反向加速度
            force = Vector.create(-deac*me.velocity.x/velocity, -deac*me.velocity.y/velocity);
        }else{
            // 给横向加速度
            force = Vector.create(x*0.015, 0);
        }

        addForce(force);
    });
    controller.on('start', function() {
        if(firstStart) {
            playHistory();
            let pathId = historyPath.push([])-1;
            interval = savePath(historyPath[pathId], me);
            firstStart=false;
        }
    });
}

// 初始化地图
function initMap() {
    // 创建安全刚体
    let leftWall = Bodies.rectangle(0, appHeight/2, 1, appHeight, {
            isStatic: true,
            density: 100, // 密度
            render: {
                fillStyle: 'black'
            }
        }),  // 左墙
        rightWall = Bodies.rectangle(appWidth, appHeight/2, 1, appHeight, {
            isStatic: true,
            density: 100, // 密度
            render: {
                fillStyle: 'black'
            }
        }),  // 右墙
        ceil = Bodies.rectangle(appWidth/2, -2, appWidth, 1, {
            isStatic: true,
            density: 100, // 密度
            render: {
                fillStyle: 'black'
            }
        }),                 // 天花板
        // ground = Bodies.rectangle(appWidth/2, appHeight-2, appWidth, 1, {
        //     isStatic: true,
        //     render: {
        //         fillStyle: 'black'
        //     }
        // }),      // 地板
        item1 = Bodies.rectangle(appWidth/2-4, (appHeight*0.6)/2, 8, appHeight*0.6, {
            isStatic: true
        }),
        item2 = Bodies.rectangle(appWidth*0.75, appHeight*0.2, 100, 8, {
            isStatic: true
        }),
        item3 = Bodies.rectangle(appWidth*0.75, appHeight*0.35, 100, 8, {
            isStatic: true
        }),
        item4 = Bodies.rectangle(appWidth*0.75, appHeight*0.50, 100, 8, {
            isStatic: true
        }),
        item5 = Bodies.rectangle(appWidth*0.75, appHeight*0.65, 100, 8, {
            isStatic: true
        }),
        item6 = Bodies.rectangle(appWidth-50, appHeight*0.1, 100, 8, {
            isStatic: true
        }), // 起始块
        item7 = Bodies.rectangle(appWidth/2-50-10, appHeight*0.72, 100, 8, {
            isStatic: true
        }),
        item8 = Bodies.rectangle(appWidth*0.25, appHeight*0.35, 100, 8, {
            isStatic: true
        }),
        item9 = Bodies.rectangle(appWidth*0.25, appHeight*0.50, 100, 8, {
            isStatic: true
        }),
        item10 = Bodies.rectangle(appWidth*0.25, appHeight*0.65, 100, 8, {
            isStatic: true
        }),
        item11 = Bodies.rectangle(66, appHeight*0.12+35, 132, 70, {
            isStatic: true
        }); // 终点块
    // 创建危险刚体
    let test = Bodies.rectangle(appWidth/2, appHeight-2, appWidth, 1, {
        isStatic: true,
        render: {
            fillStyle: 'black'
        }
    });

    let aim1 = Bodies.rectangle(66, appHeight*0.12-15, 1, 30, {
            isStatic: true
        }),
        aim2 = Bodies.rectangle(66+10, appHeight*0.12-10-15, 20, 10, {
            isStatic: true
        });


    // 创建成功体
    // 终点位置
    aim = Composite.create();
    Composite.add(aim, aim1);
    Composite.add(aim, aim2);

    // 主角
    me = Bodies.circle(appWidth-50, appHeight*0.06, 10, {
        density: 1, // 密度
        restitution: 0, // 弹性
        render: {
            fillStyle: 'white'
        }
    });
    // 安全墙体
    wall = Composite.create();
    Composite.add(wall, leftWall);
    Composite.add(wall, rightWall);
    // Composite.add(wall, ground);
    Composite.add(wall, ceil);
    Composite.add(wall, item1);
    Composite.add(wall, item2);
    Composite.add(wall, item3);
    Composite.add(wall, item4);
    Composite.add(wall, item5);
    Composite.add(wall, item6);
    Composite.add(wall, item7);
    Composite.add(wall, item8);
    Composite.add(wall, item9);
    Composite.add(wall, item10);
    Composite.add(wall, item11);
    // 危险墙体
    dwall = Composite.create();
    Composite.add(dwall, test);
}

// 给主角施加力
function addForce(force) {
    Body.applyForce(me, me.position, force);
}

// 主角弹跳纵向力
function bounce() {
    if(canBounce) {
        if(firstStart) {
            playHistory();
            let pathId = historyPath.push([])-1;
            interval = savePath(historyPath[pathId], me);
            firstStart=false;
        }
        Body.applyForce(me, me.position, {x: 0, y: -7});
        canBounce=false;
    }
}

// 记录第n位角色路径
function savePath(array, obj) {
    return setInterval( () => {
        array.push({
            ...obj.position,
        });
    }, savePathInterval);
}

// 重放灵魂Path
function playHistory() {
    // 清除之前的影子
    pasts.forEach( val => {
        document.body.removeChild(val);
    });
    pasts = [];
    // 播放影子
    historyPath.forEach( val => {
        // TODO 播放
        let past = document.createElement('div');
        past.setAttribute('style', 'z-index:9999;position:fixed;width:20px;height:20px;border-radius: 100%;background: rgba(255,255,255,0.2);');
        pasts.push(past);
        document.body.appendChild(past);
        let cnt = 0;
        let player = setInterval( () => {
            if(val[cnt]!==undefined) {
                past.style.left = val[cnt].x-10+'px';
                past.style.top = val[cnt].y-10+'px';
            }else{
                clearInterval(player);
                // 影子不消失
            }
            cnt++;
        }, savePathInterval);
    });
}

// 死亡
function death() {
    console.log('death');
    clearInterval(interval);
    // 原先的消失，me回起始点，重置firstStart
    document.getElementById('static').style.display = 'none';
    setTimeout( () => {
        World.remove(engine.world, me);
        me = Bodies.circle(appWidth-50, appHeight*0.06, 10, {
            density: 1, // 密度
            restitution: 0, // 弹性
            render: {
                fillStyle: 'white'
            }
        });
        document.getElementById('static').style.display = 'block';
        World.add(engine.world, me);
        firstStart=true;
    }, 100);
}

let noticeItem;

// 胜利
function aimIt() {
    console.log('success');
    // 停止记录路径
    if(interval) clearInterval(interval);
    // 回到起点
    World.remove(engine.world, me);
    me = Bodies.circle(appWidth-50, appHeight*0.06, 10, {
        density: 1, // 密度
        restitution: 0, // 弹性
        render: {
            fillStyle: 'white'
        }
    });
    World.add(engine.world, me);
    // alert('success');
    noticeItem = document.createElement('div');
    noticeItem.setAttribute('class', 'box-div');
    let item = document.createElement('div');
    let child = document.createElement('span');
    let button = document.createElement('button');
    button.setAttribute('class', 'btn');
    item.setAttribute('class', 'success-notice');
    button.setAttribute('onclick', 'deleNotice()');
    button.innerHTML = 'OK';
    child.innerHTML = 'Success';
    item.appendChild(child);
    item.appendChild(button);
    noticeItem.appendChild(item);
    document.body.appendChild(noticeItem);
    playHistory();
}

function deleNotice() {
    document.body.removeChild(noticeItem);
    noticeItem=null;
    World.remove(engine.world, me);
    me = Bodies.circle(appWidth-50, appHeight*0.06, 10, {
        density: 1, // 密度
        restitution: 0, // 弹性
        render: {
            fillStyle: 'white'
        }
    });
    World.add(engine.world, me);
    // 清理historyPath
    historyPath = [];
}

function startGame(){
    let startbotton = document.createElement("botton");
    startbotton.style='position:absolute;width:40%;top:86%;';
    startbotton.style.margin="0 30%";
    startbotton.style.backgroundColor='rgb(180,180,180)';
    startbotton.style.textAlign="center";
    startbotton.style.lineHeight="45px";
    startbotton.innerHTML ="START";
    startbotton.setAttribute('onclick','NewGame()');
    startbotton.setAttribute('id','START');

    let title = document.createElement("h1");
    title.innerHTML ="Go with Failed";
    title.setAttribute('id','TITLE');
    title.style='position:absolute;width:100%;top:20%;text-align: center;color:white;';

    document.getElementById("bottom").appendChild(title);

    document.getElementById("bottom").appendChild(startbotton);
}

function NewGame(){
    initNipple();
    let a =document.getElementById("START");
    a.style.display="none";
    a=document.getElementById("TITLE");
    a.style.display="none";

}

// 启动
window.onload = () => {
    let preX, preY;
    setTimeout(()=>{
        document.getElementsByTagName('canvas')[0].ontouchstart = evt => {
            if(evt.targetTouches.length>=2) {
                evt.preventDefault();
            }else {
                preX = evt.changedTouches[0].pageX;
                preY = evt.changedTouches[0].pageY;
            }
        };
        // document.getElementsByTagName('canvas')[0].ontouchmove = evt => {
        //     evt.preventDefault();
        // };
        document.getElementsByTagName('canvas')[0].ontouchend = evt => {
            let resX = evt.changedTouches[0].pageX;
            let resY = evt.changedTouches[0].pageY;
            let disX = resX-preX,
                disY = resY-preY;
            if((Math.abs(disY) > Math.abs(disX)) && (disY>0)) {
                // pass
                console.log('ok');
            } else {
                evt.preventDefault();
            }
        };
    }, 50);
    appWidth = document.body.clientWidth;
    appHeight = document.body.clientHeight-140;
    wholeHeight = document.body.clientHeight;
    initScene();
    startGame();
    // aimIt();
};
