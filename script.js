let current = 0;
let score = 0;
let user = "";
let selected = {};
let audioCtx;
let isAdmin = false;
const ADMIN_PASSWORD = "quiz2024"; // CHANGE THIS PASSWORD

// SOUND - Positive vibe chime
function sound(type){
  if (!audioCtx) audioCtx = new AudioContext();

  if(type === "correct"){
    playNote(523.25, 0, 0.15); // C5
    playNote(659.25, 0.1, 0.15); // E5
    playNote(783.99, 0.2, 0.3); // G5
  }
  else if(type === "wrong"){
    playTone(400, 0, 0.1, 'sawtooth', 0.3);
    playTone(300, 0.1, 0.2, 'sawtooth', 0.2);
  }
  else if(type === "start"){
    playNote(523.25, 0, 0.1);
    playNote(783.99, 0.1, 0.2);
  }
  else if(type === "click"){
    playTone(800, 0, 0.05, 'sine', 0.2);
  }
}

function playNote(freq, delay, duration){
  setTimeout(()=>{
    let o = audioCtx.createOscillator();
    let g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.3, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    o.start();
    o.stop(audioCtx.currentTime + duration);
  }, delay * 1000);
}

function playTone(freq, delay, duration, type='sine', vol=0.3){
  setTimeout(()=>{
    let o = audioCtx.createOscillator();
    let g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    o.start();
    o.stop(audioCtx.currentTime + duration);
  }, delay * 1000);
}

// ADMIN FUNCTIONS
function toggleAdmin(){
  document.getElementById("adminPanel").classList.toggle("hidden");
}

function enableAdmin(){
  let pass = document.getElementById("adminPass").value;
  if(pass === ADMIN_PASSWORD){
    isAdmin = true;
    alert("Admin mode enabled! You can now see who picked what + delete scores.");
    showBoards();
    document.getElementById("adminPanel").classList.add("hidden");
  } else {
    alert("Wrong password!");
  }
}

function deleteScore(name){
  if(!isAdmin) return;
  if(confirm(`Delete ${name}'s score and answers?`)){
    let data = JSON.parse(localStorage.getItem("board")||"[]");
    data = data.filter(d => d.name!== name);
    localStorage.setItem("board", JSON.stringify(data));
    showBoards();
  }
}

// FRIEND TYPE MESSAGE - SAVAGE VERSION
function getFriendType(score, total){
  let percent = (score / total) * 100;

  if(percent === 100) return "🔮 MIND READER STATUS! Are you stalking me or what? 💯 You know me better than I know myself! Twin flame vibes ✨";
  if(percent >= 90) return "👑 BESTIE FOR LIFE! You're literally my person 💕 9/10 therapists recommend you as my emotional support human";
  if(percent >= 70) return "🎯 RIDE OR DIE! You passed the vibe check ✅ We sharing brain cells at this point 🧠";
  if(percent >= 50) return "🍕 PIZZA BUDDY LEVEL! You're cool but we're not sharing fries yet 😏 Get to know me better!";
  if(percent >= 30) return "👀 ACQUAINTANCE ZONE! I've seen you around... I think? 🤔 We need to trauma bond ASAP";
  if(percent >= 10) return "🚩 SUS LEVEL: Do I know you? Did we meet at 3am? 📱 Name doesn't ring a bell but let's fix that!";
  return "💀 WHO ARE YOU?! FBI agent? You're giving 'met me once at a party' energy 🕵️ We need to talk!";
}

// QUIZ FUNCTIONS
function checkName(){
  let n = document.getElementById("nameInput").value;
  document.getElementById("startBtn").disabled = n.trim()==="";
}

function startQuiz(){
  user = document.getElementById("nameInput").value.trim();
  sound("start");
  document.getElementById("startPage").classList.add("hidden");
  document.getElementById("quizPage").classList.remove("hidden");
  load();
}

function load(){
  let q = quiz[current];
  document.getElementById("progress").innerText = `Question ${current+1}/${quiz.length}`;
  document.getElementById("question").innerText = (current+1)+". "+q.question;
  document.getElementById("backBtn").disabled = current === 0;
  document.getElementById("nextBtn").innerText = current === quiz.length-1? "Finish" : "Next";

  let box = document.getElementById("options");
  box.innerHTML="";

  q.options.forEach(opt=>{
    let div=document.createElement("div");
    div.className="option";
    div.dataset.answer = opt.t;

    if(selected[current]){
      // Q3 has no correct answer - it's personal
      if(current!== 2){
        if(opt.t===q.answer) div.classList.add("correct");
        if(selected[current]===opt.t && opt.t!==q.answer)
          div.classList.add("wrong");
      } else {
        // Q3: just mark what they selected
        if(selected[current]===opt.t) div.classList.add("correct");
      }
    }

    div.innerHTML=`
      <img src="${opt.img}" alt="${opt.t}" onerror="this.src='https://via.placeholder.com/300x200/667eea/ffffff?text=${encodeURIComponent(opt.t)}'">
      <span>${opt.t}</span>
    `;

    div.onclick=()=>{
      if(selected[current]) return;
      selected[current]=opt.t;

      // Q3 is personal - no wrong answers, always "correct" sound
      if(current === 2){
        div.classList.add("correct");
        sound("correct");
      } else {
        if(opt.t===q.answer){
          div.classList.add("correct");
          score++;
          sound("correct");
        } else {
          div.classList.add("wrong");
          sound("wrong");
          document.querySelectorAll(".option").forEach(o=>{
            if(o.dataset.answer === q.answer){
              o.classList.add("correct");
            }
          });
        }
      }
    };
    box.appendChild(div);
  });
}

function nextQuestion(){
  sound("click");
  if(current<quiz.length-1){
    current++;
    load();
  } else {
    result();
  }
}

function prevQuestion(){
  sound("click");
  if(current>0){
    current--;
    load();
  }
}

function result(){
  document.getElementById("quizPage").classList.add("hidden");
  document.getElementById("resultPage").classList.remove("hidden");
  document.getElementById("scoreText").innerText = `${user}, your score is ${score}/${quiz.length-1}`; // -1 because Q3 doesn't count
  document.getElementById("friendType").innerText = getFriendType(score, quiz.length-1);
  save();
  showBoards();
}

function save(){
  let data = JSON.parse(localStorage.getItem("board")||"[]");
  let existing = data.find(d => d.name === user);

  // Save full answers + relationship choice from Q3
  let playerData = {
    name: user,
    score: score,
    answers: selected,
    relationship: selected[2] || "Not answered" // Q3 answer
  };

  if (!existing || score > existing.score) {
    data = data.filter(d => d.name!== user);
    data.push(playerData);
  }
  localStorage.setItem("board", JSON.stringify(data));
}

function showBoards(){
  let data = JSON.parse(localStorage.getItem("board")||"[]");
  data.sort((a,b)=>b.score-a.score);

  let html = data.slice(0,10).map((d,i)=>{
    let relationshipTag = isAdmin? ` | Thinks you're: <b>${d.relationship || '?'}</b>` : '';
    let deleteBtn = isAdmin? `<button class="delete-btn" onclick="deleteScore('${d.name}')">Delete</button>` : '';
    return `<p>${i+1}. ${d.name} - ${d.score}/${quiz.length-1}${relationshipTag} ${deleteBtn}</p>`;
  }).join("");

  document.getElementById("board").innerHTML = html || "<p>No scores yet. Be the first!</p>";
  document.getElementById("homeBoard").innerHTML = html || "<p>No scores yet. Be the first!</p>";
}

const quiz = [
{
question:"My biggest bad habit?",
options:[
{t:"Overthinking everything",img:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop"},
{t:"Procrastinating",img:"https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400&h=300&fit=crop"},
{t:"Spending money",img:"https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop"},
{t:"Being late",img:"https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&h=300&fit=crop"}
],
answer:"Overthinking everything"
},
{
question:"Most used app?",
options:[
{t:"YouTube",img:"https://img.icons8.com/color/480/youtube-play.png"},
{t:"Instagram",img:"https://img.icons8.com/color/480/instagram-new.png"},
{t:"WhatsApp",img:"https://img.icons8.com/color/480/whatsapp.png"},
{t:"JioHotstar",img:"https://img.icons8.com/color/480/hotstar.png"}
],
answer:"JioHotstar"
},
{
question:"Whom am I to you?",
options:[
{t:"Brother",img:"https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=300&fit=crop"},
{t:"Sister",img:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop"},
{t:"Partner",img:"https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=300&fit=crop"},
{t:"Enemy",img:"https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=400&h=300&fit=crop"}
],
answer:"" // No correct answer - this is personal
},
{
question:"Dream place?",
options:[
{t:"Beach",img:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop"},
{t:"City",img:"https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=300&fit=crop"},
{t:"Forest",img:"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop"},
{t:"Mountain",img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"}
],
answer:"Mountain"
},
{
question:"Cake flavor?",
options:[
{t:"Chocolate",img:"https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop"},
{t:"Vanilla",img:"https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=400&h=300&fit=crop"},
{t:"Pineapple",img:"https://images.unsplash.com/photo-1562440499-64c9a111f713?w=400&h=300&fit=crop"},
{t:"Strawberry",img:"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop"}
],
answer:"Pineapple"
},
{
question:"Which food I like the most?",
options:[
{t:"Chicken",img:"https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=300&fit=crop"},
{t:"Fish",img:"https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop"},
{t:"Mutton",img:"https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop"},
{t:"Crab",img:"https://images.unsplash.com/photo-1559825481-12a05cc00344?w=400&h=300&fit=crop"}
],
answer:"Crab"
},
{
question:"Indoor activity?",
options:[
{t:"Gaming",img:"https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=300&fit=crop"},
{t:"Reading",img:"https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=300&fit=crop"},
{t:"Coding",img:"https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop"},
{t:"Sleeping",img:"https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=300&fit=crop"}
],
answer:"Sleeping"
},
{
question:"Favorite weather?",
options:[
{t:"Summer",img:"https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=400&h=300&fit=crop"},
{t:"Rainy",img:"https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=400&h=300&fit=crop"},
{t:"Winter",img:"https://images.unsplash.com/photo-1483664852095-d6cc6870702d?w=400&h=300&fit=crop"},
{t:"Autumn",img:"https://images.unsplash.com/photo-1507783548227-544c3b8fc065?w=400&h=300&fit=crop"}
],
answer:"Winter"
},
{
question:"Personality?",
options:[
{t:"Calm",img:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop"},
{t:"Funny",img:"https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=300&fit=crop"},
{t:"Angry",img:"https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=400&h=300&fit=crop"},
{t:"Friendly",img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop"}
],
answer:"Friendly"
},
{
question:"Go-to comfort food?",
options:[
{t:"Biryani",img:"https://images.unsplash.com/photo-1631515242808-497c3fbd3972?w=400&h=300&fit=crop"},
{t:"Maggi",img:"https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=300&fit=crop"},
{t:"Ice Cream",img:"https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop"},
{t:"Chocolate",img:"https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop"}
],
answer:"Biryani"
}
];

showBoards();