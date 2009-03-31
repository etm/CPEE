require 'thread'
require 'logger'

class Wee 
  def initialize
    # Attention (!!!), redefined, see wee_initialize
    ###### self::wee_initialize
  end
  def self::wee_initialize
    send :define_method, :initialize do
      initialize_search if methods.include?('initialize_search')
      initialize_context if methods.include?('initialize_context')
      initialize_endstate if methods.include?('initialize_endstate')
      @__wee_stop_positions = Array.new
      @__wee_threads = Array.new;
      $LOG = Logger.new(STDOUT) unless defined? $LOG
    end
  end
  def self::search(wee_search)
    define_method 'search=' do |new_wee_search|
      @__wee_search_positions = Hash.new
      if new_wee_search.is_a?(Hash) && new_wee_search.size == 1
          @__wee_search_original = new_wee_search.keys[0]
          @__wee_search_positions_original = new_wee_search[@__wee_search_original]
          @__wee_search_positions_original.each { |search_position| @__wee_search_positions[search_position.position] = search_position } if @__wee_search_positions_original.is_a?(Array)
          @__wee_search_positions[@__wee_search_positions_original.position] = @__wee_search_positions_original if @__wee_search_positions_original.is_a?(SearchPos)
      else
        @__wee_search_original = false
      end
      @__wee_search = @__wee_search_original
    end
    define_method :search do
      return {@__wee_search_original => @__wee_search_positions_original}
    end
    define_method :initialize_search do self.search=wee_search end
    wee_initialize
  end

  def self::endpoint(endpoints)
    endpoints.each do |name,value|
      define_method name do
        return value
      end
      define_method "#{name}=" do |new_value|
        instance_variable_set("@#{name}", new_value)
        instance_eval("def #{name}\n return @#{name}\n end")
      end
    end
    define_method :endpoint do |new_endpoint|
      new_endpoint.each do |name,value|
        instance_variable_set("@#{name}", value)
        instance_eval("def #{name}\n return @#{name}\n end")
      end
    end
  end

  def self::context(variables)
    @@__wee_new_context_variables ||= Array.new
    @@__wee_new_context_variables << variables
    define_method 'context=' do |newContext|
      @__wee_context ||= Hash.new
      newContext.each do |name, value|
        instance_variable_set(("@" + name.to_s).to_sym,value)
        @__wee_context[("@" + name.to_s).to_sym] = value
      end
    end
    define_method :context do |*optParam|
      optParam.each{ |entry| self.context=entry}
      return @__wee_context ? @__wee_context : Hash.new
    end
    define_method :initialize_context do
      @@__wee_new_context_variables.each { |item|  self.context=item}
    end
    wee_initialize
  end

  def self::endstate(state)
    define_method 'endstate=' do |newState|
      @__wee_stop_positions = Array.new if @__wee_endstate != newState
      search= {@__wee_search_original => @__wee_search_positions_original}
      @__wee_endstate = newState
    end
    define_method :endstate do
      return @__wee_endstate
    end
    define_method :initialize_endstate do
      self.endstate=state
    end
    wee_initialize
  end
  
  protected
    def position
      return @__wee_stop_positions
    end
    def activity(position, type, endpoint=nil,*parameters)
      return if endstate == :stopped || Thread.current[:nolongernecessary] || is_in_search_mode(position)
      
      handler = create_handler
      begin
        case type
          when :manipulate
            yield if block_given?
            refreshcontext
            handler.inform_activity_done position, context
          when :call
            passthrough = get_matching_search_position(position) ? get_matching_search_position(position).passthrough : nil
            retValue = perform_external_call position, passthrough, handler, endpoint, parameters
            yield(retValue) if block_given? && endstate != :stopped && !Thread.current[:nolongernecessary]
            refreshcontext
            handler.inform_activity_done position, context unless endstate == :stopped || Thread.current[:nolongernecessary]
        else
          raise "Invalid activity type #{type}. Only :manipulate or :call allowed"
        end
      rescue => err
        refreshcontext
        handler.inform_activity_failed position, context, err
      end
    end
    # Parallel DSL-Construct
    # Defines Workflow paths that can be executed parallel.
    # May contain multiple branches (parallel_branch)
    def parallel(type=:wait)
      @__wee_threads = Array.new
      mythreads = Array.new
      # Handle the yield block (= def of parallel branches) in a 
      # Mutex to resolve conflicts (waiting for branches) in 
      # nested parallel blocks
      semaphore = Mutex.new
      semaphore.synchronize { 
        yield
        mythreads = @__wee_threads.clone
      }
      wait_count = (type.is_a?(Hash) && type.size == 1 && type[:wait] != nil && type[:wait].is_a?(Integer)) ? wait_count = type[:wait] : mythreads.size
      finished_threads_count = 0;
      while(finished_threads_count < wait_count && finished_threads_count <= mythreads.size)
        Thread.pass;
        finished_threads_count = 0;
        mythreads.each { |thread|  finished_threads_count+=1 unless thread.alive?}
      end
      mythreads.each { |thread|  thread[:nolongernecessary] = true if thread.alive?}
    end
    # Defines a branch of a parallel-Construct
    def parallel_branch
      @__wee_threads << Thread.new do
        Thread.current[:branch_search] = @__wee_search
        yield
      end
    end

    # Switch DSL-Construct
    # Defines a choice in the Workflow path.
    # May contain multiple execution alternatives
    def switch
      Thread.current[:alternative_executed] = false
      yield
    end
    # Defines a possible choice of a switch-Construct
    # Block is executed if condition == true or
    # searchmode is active (to find the starting position)
    def alternative(condition = nil)
      if(condition == nil)
        yield unless Thread.current[:alternative_executed]
      else
        yield if is_in_search_mode || condition
        Thread.current[:alternative_executed] = true if condition
      end
    end
    
  private
    def is_in_search_mode(position = nil)
      # set semaphore to avoid conflicts if @__wee_search is changed by another thread
      semaphore = Mutex.new
      semaphore.synchronize { 
        branch = Thread.current;
        if position && get_matching_search_position(position) # matching searchposition => start execution from here
          searchpos = get_matching_search_position(position)
          $LOG.debug("Wee.activity") {"position #{position} found, processing branch from here"}
          $LOG.debug("Wee.activity") {"exactly: starting after this activity "} if searchpos.detail == :after
          branch[:branch_search] = false;
          @__wee_search = false;
          return false if searchpos.detail == :at
          return true if searchpos.detail == :after
        end
        if branch[:branch_search] || @__wee_search # is activity part of a branch and in search mode?
          $LOG.debug("Wee.activity") {"omitting #{position}, this branch is still in search mode"}
          return true;
        end
      }
    end
    def perform_external_call(position, passthrough, handler, endpoint, *parameters)
      # handshake call and wait until it finisheds
      handler.handle_call position, passthrough, endpoint, parameters
      Thread.pass until handler.finished_call() || endstate == :stopped || Thread.current[:nolongernecessary]
       
      handler.no_longer_necessary if Thread.current[:nolongernecessary]
      handler.stop_call if endstate == :stopped
      @__wee_stop_positions << SearchPos.new(position, :at, handler.passthrough) if endstate == :stopped
      return ((Thread.current[:nolongernecessary] || endstate == :stopped) ? nil : handler.return_value)
    end
    def refreshcontext()
      @__wee_context.each { |varname, value| 
        @__wee_context[varname] = instance_variable_get(varname)
      }
    end
    def get_matching_search_position(position)
      return @__wee_search_positions[position] if @__wee_search_positions[position]
      return nil
    end
    
  public
    def stop()
      $LOG.debug('Wee.stop') {"Got Stop signal, ...."}
      @__wee_endstate = :stopped
    end
end

class SearchPos
  attr_accessor :position, :detail, :passthrough
  def initialize(position, detail=:at, passthrough=nil)
    @position = position
    @detail = detail
    @passthrough = passthrough
  end
end