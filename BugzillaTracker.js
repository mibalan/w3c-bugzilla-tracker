(function () {

    function IssueDashboard(){
        var _dashboard = document.createElement("div"),
            _offlineIssues = {},
            _onlineIssues = {},
            _issueTemplate = null,
            _header = document.createElement("a")
            
        _header.href = "#"
        _header.className = "issue-dashboard-header"
        _header.innerHTML = "Bug Dashboard"
        
        _header.addEventListener("click", function(e){
            e.preventDefault()
            _dashboard.classList.toggle("open")
        })  
        
        _dashboard.id = "issue-dashboard" 
        _dashboard.appendChild(_header)
        
        document.body.appendChild(_dashboard) 
            
        
        function getNewIssues(){
            var id, issues = []

            for (id in _onlineIssues){

                if (!_offlineIssues[id]){   
                    // not found in the document. 
                    // it's a new issue if the bug_status is not RESOLVED
                    if (_onlineIssues[id].bug_status !== "RESOLVED") {

                        _onlineIssues[id].issue_state = "new"
                        issues.push(_onlineIssues[id])
                    }
                }
            }

            return issues 
        }
        
        function getChangedIssues(){   
            var id, changed, issues = []

            for (id in _onlineIssues){

                // is the bug in the doument?
                if (_offlineIssues[id]){

                    changed = false
                    
                    // bug description has changed  
                    if (_offlineIssues[id].short_desc !== _onlineIssues[id].short_desc){
                        
                        _onlineIssues[id].issue_state = "updated"  
                        changed = true 
                    }     

                    // bug status has changed  
                    if (_offlineIssues[id].bug_status !== _onlineIssues[id].bug_status){  

                        // changes from NEW -> ASSIGNED aren't noteworthy
                        if ( !(_offlineIssues[id].bug_status == "NEW" && _onlineIssues[id].bug_status == "ASSIGNED") ){
                            _onlineIssues[id].issue_state = "updated";  
                            changed = true
                        }
                    }

                    if (changed){
                        // the issue has been changed, collect it
                        issues.push(_onlineIssues[id])
                    }
                }
            }

            return issues
         } 
         
        
        function renderIssues(issues){
            var issueItem, 
                issueList = document.createElement("ul")
            
            issueList.className = "issue-list"
            
            issues.forEach(function(issue){ 
               issueItem = document.createElement("li")  
               
               var meta = document.createElement("span")
               meta.className = "issue-meta"
               meta.innerHTML =  issue["issue_state"] 
               
               var toggle = document.createElement("a")
               toggle.href = "#" 
               toggle.className = "toggle"
               toggle.innerHTML = "toggle markup"
               toggle.addEventListener("click", function(parent){
                   
                   return function(e){  
                       e.preventDefault()
                       parent.classList.toggle("showMarkup")    
                   }
                                     
               }(issueItem))
                           
               // populate the issue template with data
               var issueDOM = _issueTemplate(issue) 
                                
               // container for issue markup
               var markup = document.createElement("pre")
               var temp = document.createElement("div")
               temp.appendChild(issueDOM.cloneNode(true))
               markup.textContent = temp.innerHTML
                
               issueItem.appendChild(meta)
               issueItem.appendChild(toggle)
               issueItem.appendChild(markup)
               issueItem.appendChild(issueDOM)                           
               
               issueList.appendChild(issueItem)
            })
            
            _dashboard.appendChild(issueList)
        }   
        
        return {
            setOnlineIssues: function(issues){
                _onlineIssues = issues || []
            },
        
            setOfflineIssues: function(issues){
                _offlineIssues = issues || []
            },
            
            setIssueTemplate: function(string){
                _issueTemplate = TemplateManager.compile(string)
            },
        
            sync: function(){ 
                if (!_issueTemplate){
                    throw new Error("IssueDashboard is missing 'issueTemplate'. Expected String, got "+ typeof _issueTemplate)
                }
                
                if (!_onlineIssues){
                    throw new TypeError("Missing 'serverIssues' from server. Expected Object, got "+ typeof _onlineIssues)
                }

                if (!_offlineIssues){
                    throw new TypeError("Missing 'documentIssues' from document. Expected Object, got "+ typeof _offlineIssues)
                }    
                
                var newIssues = getNewIssues(),
                    changedIssues = getChangedIssues(),
                    issues = newIssues.concat(changedIssues)   
                    
                // there's work to be done    
                if (issues.length){
                    
                    _dashboard.className = "warning"
                    renderIssues(issues)
                    
                    return
                }         
                
                _dashboard.className = "ok"
            }
        }
    }   
    
    function getIssuesFromDocument() { 
        var list = {},
            issues = document.querySelectorAll(".issue-marker");

        if (issues) {
            // make issue an array
            issues = Array.prototype.slice.call(issues); 

            // pluck out the bug data from the DOM object
            issues.forEach(function (issue) { 

                var bugId = issue.dataset["bug_id"];

                if (bugId){
                    list[bugId] = {
                        "bug_status": issue.dataset["bug_status"],
                        "short_desc": issue.querySelector(".short-desc").innerText
                    }
                }  
                
            })
        }

        return list;
    }
    
    var dashboard = new IssueDashboard()
        dashboard.setIssueTemplate(document.querySelector("#issue-template").innerHTML)
        
    var docIssues = getIssuesFromDocument()
        dashboard.setOfflineIssues(docIssues)
    
    
    window.checkSpecificationIssues = function (product, component) {
        
        document.addEventListener("DOMContentLoaded", function(){  
            
            BugzillaTracker.sync({
                product: product, // e.g., 'CSS'
                component: component // e.g., "Regions",
            }, 
            
            function(issues){
                dashboard.setOnlineIssues(issues)
                dashboard.sync()
            }); 
               
        });
    };
})();
