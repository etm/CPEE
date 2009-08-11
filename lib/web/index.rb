require '../lib/rum'
require 'WebWorkflow'
require 'cgi'

use Rack::ShowStatus
run Rum.new {
  def display_mask
    $message ||= ""
    $message += CGI.escapeHTML($wf_result.inspect)+"<BR/>" if $wf_result
    $wf_result = nil
    puts <<-END
      <head>
      </head>
      <body>
      <h1>Output</h1
      <p>#{$message}</p>
      <h1>Control</h1>
      <form name="f">
          <table border="1">
              <tr>
                  <td valign="top">
                    <textarea name="code" cols="40" rows="10"></textarea><BR/>
                    <input value="Perform" type="submit" class="width: 40;height:40;"/><BR/>
                    <textarea name="new_execute" cols="40" rows="10"></textarea><BR/>
                    <input value="set execute" type="button" onclick="window.document.f.code.value = '$wf.replace do\\n'+window.document.f.new_execute.value+'\\nend'"/>
                  </td>
                  <td>
                    <table>
                      <tr><td colspan="2"><hr/></td></tr>
                      <tr><td colspan="2">Release</td></tr>
                      <tr>
                          <td colspan="2">
                            <input type="text" name="position" value="a1"/>
                            <input value="release Call" type="button" onclick="window.document.f.code.value = '$released +=&quot;release '+window.document.f.position.value+'&quot;'"/>
                          </td>
                      </tr>
                      <tr><td colspan="2"><hr/></td></tr>
                      <tr><td colspan="2">Control</td></tr>
                      <tr>
                          <td colspan="2">
                            <input value="prepare new workflow" type="button" onclick="window.document.f.code.value = '$wf = WebWorkflow.new;'"/>
                            <input value="start new workflow" type="button" onclick="window.document.f.code.value = '$wf.state=:normal;\\n$wf_thread = Thread.new { $wf_result = $wf.start }'"/>
                            <input value="stop workflow" type="button" onclick="window.document.f.code.value = '$wf.stop;'"/>
                            <input value="clear log" type="button" onclick="window.document.f.code.value = '$message = &quot;&quot;;'"/>
                          </td>
                      </tr>
                      <tr><td colspan="2"><hr/></td></tr>
                      <tr><td colspan="2">Endpoints</td></tr>
                      <tr>
                          <td colspan="2">
                            <input value="show" type="button" onclick="window.document.f.code.value = '$message+=&quot;Endpoint1=&quot;+$wf.endpoint1+&quot;<BR/>&quot;'"/>
                            <input value="endpoint1" type="text"/>
                            <input value="www.heise.de" type="text" name="ep1"/>
                            <input value="change" type="button" onclick="window.document.f.code.value = '$wf.endpoint1 = &quot;'+window.document.f.ep1.value+'&quot;'"/>
                          </td>
                      </tr>
                      <tr>
                          <td colspan="2">
                            <input value="show" type="button" onclick="window.document.f.code.value = '$message+=&quot;Endpoint2=&quot;+$wf.endpoint2+&quot;<BR/>&quot;'"/>
                            <input value="endpoint2" type="text"/>
                            <input value="www.orf.at" type="text" name="ep2"/>
                            <input value="change" type="button" onclick="window.document.f.code.value = '$wf.endpoint2 = &quot;'+window.document.f.ep2.value+'&quot;'"/>
                          </td>
                      </tr>
                      <tr>
                          <td colspan="2">
                            <input value="show" type="button" onclick="window.document.f.code.value = '$message+=&quot;Endpoint3=&quot;+$wf.endpoint3+&quot;<BR/>&quot;'"/>
                            <input value="endpoint3" type="text"/>
                            <input value="www.google.com" type="text" name="ep3"/>
                            <input value="change" type="button" onclick="window.document.f.code.value = '$wf.endpoint3 = &quot;'+window.document.f.ep3.value+'&quot;'"/>
                          </td>
                      </tr>
                      <tr><td colspan="2"><hr/></td></tr>
                      <tr><td colspan="2">Context</td></tr>
                      <tr>
                          <td colspan="2">
                            <input value="show" type="button" onclick="window.document.f.code.value = '$message+=&quot;context=&quot;+$wf.context.inspect+&quot;<BR/>&quot;'"/>
                          </td>
                      </tr>
                      <tr>
                          <td colspan="2">
                            <input value="@x" type="text"/>
                            <input value="1" type="text" name="context1"/>
                            <input value="change" type="button" onclick="window.document.f.code.value = '$wf.context :x => &quot;'+window.document.f.context1.value+'&quot;'"/>
                          </td>
                      </tr>
                      <tr>
                          <td colspan="2">
                            <input value="@y" type="text"/>
                            <input value="1" type="text" name="context2"/>
                            <input value="change" type="button" onclick="window.document.f.code.value = '$wf.context :y => &quot;'+window.document.f.context2.value+'&quot;'"/>
                          </td>
                      </tr>
                      <tr><td colspan="2"><hr/></td></tr>
                      <tr><td colspan="2">Search</td></tr>
                      <tr>
                          <td colspan="2">
                              <input type="button" value="show" onclick="window.document.f.code.value = '$message += &quot;Search=&quot+CGI.escapeHTML($wf.search.inspect)+&quot;<BR/>&quot;'"/>
                              <select name="search" size="1"><option>true</option><option>false</option></select>
                              <input type="text" name="searchpos1" value=":a1"/>
                              <input type="text" name="searchdetail1" value=":at"/>
                              <input type="text" name="searchpassthrough1" value="abc"/>
                              <input type="button" value="set" onclick="window.document.f.code.value = '$wf.search ={'+window.document.f.search.value+' => Wee::SearchPos.new('+window.document.f.searchpos1.value+', '+window.document.f.searchdetail1.value+', &quot;'+window.document.f.searchpassthrough1.value+'&quot;)}'"/>
                          </td>
                      </tr>
                    </table>
                  </td>
              </tr>
          </table>
          <hr/>
          <p>Sample Execute:</p>
<pre>    activity :a1, :call, endpoint1
    activity :a2, :call, endpoint1 do |result|
      @x += result;
    end
    activity :a3, :call, endpoint1, @x</pre>
<hr/>
<pre>    activity :a1, :call, endpoint1
    parallel do
      parallel_branch do activity :a2_1, :call, endpoint2 end
      parallel_branch do activity :a2_2, :call, endpoint2 end
    end
    activity :a2, :call, endpoint1 do |result|
      @x += result;
    end
    activity :a3, :call, endpoint1, @x</pre>
      </form>
      </body>
    END
  end

  on param "code" do |code|
    $message += "<hr/></BR>Evaluating: #{CGI.escapeHTML(code)}<BR/>"
    eval(code)
    sleep(1)
    display_mask
  end
  on default do
    $released = "";
    $message = ""
    $wf = WebWorkflow.new
    $wf_thread = Thread.new { $wf_result = $wf.start }
    sleep(2)
    display_mask
  end
}

