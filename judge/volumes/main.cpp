#include <bits/stdc++.h>
using namespace std;

int main(){
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Starting of your code

    string s; cin>>s;
          for (int i=0; i<s.length(); i++){
      if (s[i]>='A' && s[i]<='Z') s[i] = s[i] - 'A' + 'a';
         }
         cout<<s<<"\n";

    // Ending of your code

    return 0;
}